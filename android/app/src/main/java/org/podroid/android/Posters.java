/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
package org.podroid.android;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Posters for the launcher's games: box art from IGDB for the games in
 * [#IGDB], from Wikipedia where a game has an article with one, or from
 * the game's iTunesArtwork. Downloaded posters are kept in Podroid_posters,
 * and games without one are looked up again after a week.
 */
final class Posters {
    private Posters() {}

    static final String DIR = "Podroid_posters";
    private static final int THUMBNAIL_SIZE = 450;

    private static final long RETRY_MS = 7L * 24 * 60 * 60 * 1000;
    private static final int MAX_DOWNLOAD = 4 << 20;

    /// IGDB cover image IDs, from the games' covers on igdb.com (or found
    /// with dev-scripts/igdb-covers.py, given Twitch developer credentials).
    /// IGDB's API needs credentials that can't be shipped, but its images are
    /// public.
    private static final Map<String, String> IGDB = new HashMap<>();
    static {
        IGDB.put("com.com2us.feanor2", "coaxmr"); // Chronicles of Inotia: Legend of Feanor
        IGDB.put("jp.co.capcom.biovscn", "co3dnz"); // Resident Evil: Mercenaries Vs.
        // IGDB's Dead Rising Mobile cover is a title screen, so the original's.
        IGDB.put("jp.co.capcom.deadrisingus", "co20xf");
        // P2G is Monster Hunter Freedom Unite in the West.
        IGDB.put("jp.co.capcom.mhp2gjp", "cocpe7");
        IGDB.put("jp.co.capcom.mhp2gwd", "cocpe7");
        IGDB.put("com.rockstargames.gta3vc", "co2lbb");
        IGDB.put("com.ea.nfss2.inc", "co20a7"); // Need for Speed: Shift 2 Unleashed
        // Inotia 2 (com.com2us.inotia) is left out: its IGDB cover is its
        // icon, and its iTunesArtwork makes a better poster.
    }

    /// Wikipedia articles for games whose names don't find them, as
    /// language and title.
    private static final Map<String, String[]> KNOWN = new HashMap<>();
    static {
        // None needed yet: the games known to need one are in [#IGDB].
    }

    /** The name of a game's poster files, without extension. */
    private static String key(String bundleId, String name) {
        String id = bundleId != null && !bundleId.isEmpty() ? bundleId : "name-" + name;
        return id.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    /// Where a downloaded poster is kept. IGDB covers have their ID in the
    /// name, so changing the table replaces an older poster.
    private static File posterFile(File dir, String bundleId, String name) {
        String igdb = IGDB.get(bundleId);
        return new File(dir, key(bundleId, name) + (igdb != null ? ".igdb-" + igdb : "")
            + ".jpg");
    }

    /** A downloaded poster, if there is one. */
    static Bitmap cached(File dir, String bundleId, String name) {
        File file = posterFile(dir, bundleId, name);
        return file.isFile() ? decode(file, null) : null;
    }

    /** Whether to look this game up online (again). */
    static boolean shouldFetch(File dir, String bundleId, String name) {
        String key = key(bundleId, name);
        if (posterFile(dir, bundleId, name).isFile()) {
            return false;
        }
        if (IGDB.containsKey(bundleId)) {
            return true;
        }
        File none = new File(dir, key + ".none");
        return !none.isFile() || System.currentTimeMillis() - none.lastModified() > RETRY_MS;
    }

    /**
     * Downloads the game's IGDB cover, or looks it up on Wikipedia and
     * downloads its box art. Returns null
     * if there's none, which is remembered for a while. Network errors aren't
     * remembered, so the next launch tries again. Call this off the UI thread.
     */
    static Bitmap fetch(File dir, String bundleId, String name, String userAgent) {
        String key = key(bundleId, name);
        String imageUrl;
        try {
            String igdb = IGDB.get(bundleId);
            String[] known = KNOWN.get(bundleId);
            imageUrl = igdb != null
                ? "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/" + igdb + ".jpg"
                : known != null
                ? pageImage(known[0], known[1], userAgent)
                : searchImage(name, userAgent);
        } catch (Exception e) {
            return null;
        }
        dir.mkdirs();
        if (imageUrl == null) {
            try {
                new FileOutputStream(new File(dir, key + ".none")).close();
            } catch (Exception e) {
                // Not essential.
            }
            return null;
        }
        try {
            byte[] bytes = download(imageUrl, userAgent);
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            if (bitmap == null) {
                return null;
            }
            File tmp = new File(dir, key + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(bytes);
            }
            tmp.renameTo(posterFile(dir, bundleId, name));
            new File(dir, key + ".none").delete();
            return bitmap;
        } catch (Exception e) {
            return null;
        }
    }

    /// Searches English Wikipedia, and only accepts an article whose title is
    /// the game's name (ignoring case, spacing, punctuation and a
    /// disambiguation like "(video game)"), since searches easily find the
    /// wrong game.
    private static String searchImage(String name, String userAgent) throws Exception {
        String wanted = normalize(name);
        if (wanted.length() < 3) {
            return null;
        }
        JSONObject result = api("en", "action=query&list=search&srlimit=3&srsearch="
            + URLEncoder.encode(name + " video game", "UTF-8"), userAgent);
        JSONArray hits = result.getJSONObject("query").optJSONArray("search");
        for (int i = 0; hits != null && i < hits.length(); i++) {
            String title = hits.getJSONObject(i).getString("title");
            if (normalize(title.replaceAll("\\s*\\(.*\\)$", "")).equals(wanted)) {
                return pageImage("en", title, userAgent);
            }
        }
        return null;
    }

    private static String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
    }

    /** The URL of an article's lead image (for games, the box art), if any. */
    private static String pageImage(String language, String title, String userAgent)
            throws Exception {
        JSONObject result = api(language, "action=query&prop=pageimages&piprop=thumbnail"
            + "&pithumbsize=" + THUMBNAIL_SIZE + "&pilicense=any&redirects=1&titles="
            + URLEncoder.encode(title, "UTF-8"), userAgent);
        JSONObject pages = result.getJSONObject("query").getJSONObject("pages");
        JSONObject page = pages.getJSONObject(pages.keys().next());
        JSONObject thumbnail = page.optJSONObject("thumbnail");
        return thumbnail != null ? thumbnail.getString("source") : null;
    }

    private static JSONObject api(String language, String query, String userAgent)
            throws Exception {
        String url = "https://" + language + ".wikipedia.org/w/api.php?format=json&" + query;
        return new JSONObject(new String(download(url, userAgent), StandardCharsets.UTF_8));
    }

    private static byte[] download(String url, String userAgent) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(8000);
        // Wikimedia asks clients to identify themselves.
        connection.setRequestProperty("User-Agent", userAgent);
        try (InputStream in = connection.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[1 << 14];
            int n;
            while ((n = in.read(buffer)) != -1) {
                out.write(buffer, 0, n);
                if (out.size() > MAX_DOWNLOAD) {
                    throw new Exception("too large");
                }
            }
            return out.toByteArray();
        } finally {
            connection.disconnect();
        }
    }

    private static Bitmap decode(File file, BitmapFactory.Options options) {
        try {
            return BitmapFactory.decodeFile(file.getPath(), options);
        } catch (Throwable e) {
            return null;
        }
    }

    static Bitmap fromArtwork(String ipaPath) {
        Bitmap art = readArtwork(ipaPath);
        if (art == null) {
            return null;
        }
        int longestEdge = Math.max(art.getWidth(), art.getHeight());
        if (longestEdge <= THUMBNAIL_SIZE) {
            return art;
        }
        float scale = THUMBNAIL_SIZE / (float) longestEdge;
        return Bitmap.createScaledBitmap(art, Math.max(1, Math.round(art.getWidth() * scale)),
            Math.max(1, Math.round(art.getHeight() * scale)), true);
    }

    /// The iTunesArtwork at the root of an IPA (outside its app bundle), if
    /// it has one. Importing an IPA puts this inside the unpacked bundle.
    private static Bitmap readArtwork(String ipaPath) {
        if (ipaPath != null && ipaPath.toLowerCase(Locale.ROOT).endsWith(".app")) {
            for (String name : new String[]{"iTunesArtwork@2x", "iTunesArtwork"}) {
                java.io.File file = new java.io.File(ipaPath, name);
                if (file.isFile() && file.length() <= MAX_DOWNLOAD) {
                    Bitmap bitmap = BitmapFactory.decodeFile(file.getPath());
                    if (bitmap != null) {
                        return bitmap;
                    }
                }
            }
            return null;
        }
        if (ipaPath == null || !ipaPath.toLowerCase(Locale.ROOT).endsWith(".ipa")) {
            return null;
        }
        try (java.util.zip.ZipFile zip = new java.util.zip.ZipFile(ipaPath)) {
            for (String name : new String[]{"iTunesArtwork@2x", "iTunesArtwork"}) {
                java.util.zip.ZipEntry entry = zip.getEntry(name);
                if (entry == null || entry.getSize() > MAX_DOWNLOAD) {
                    continue;
                }
                try (InputStream in = zip.getInputStream(entry)) {
                    Bitmap bitmap = BitmapFactory.decodeStream(in);
                    if (bitmap != null) {
                        return bitmap;
                    }
                }
            }
        } catch (Exception e) {
            // Not a valid zip; no artwork.
        }
        return null;
    }
}
