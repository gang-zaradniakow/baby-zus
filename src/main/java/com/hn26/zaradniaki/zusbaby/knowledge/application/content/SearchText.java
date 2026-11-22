package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Text prepared for searching, same as {@code normTxt()} of the frontend
 * prototype: HTML tags and repeated whitespace removed, lower case, Polish
 * diacritics dropped ("Zasiłek" → "zasilek").
 */
public final class SearchText {

    private static final Pattern TAG = Pattern.compile("<[^>]+>");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern COMBINING_MARK = Pattern.compile("[\\u0300-\\u036f]");

    private SearchText() {
    }

    public static String normalize(String text) {
        String plain = WHITESPACE.matcher(TAG.matcher(text).replaceAll(" ")).replaceAll(" ").trim();
        String decomposed = Normalizer.normalize(plain.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return COMBINING_MARK.matcher(decomposed).replaceAll("").replace('ł', 'l');
    }
}
