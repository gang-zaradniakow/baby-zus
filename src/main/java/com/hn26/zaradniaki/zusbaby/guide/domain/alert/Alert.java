package com.hn26.zaradniaki.zusbaby.guide.domain.alert;

/**
 * Warning shown on top of the guide.
 * @param level how serious it is
 * @param icon name of the frontend icon
 * @param title Polish title
 * @param text Polish explanation
 * @param href frontend route with more information, e.g. {@code #/wiedza/a/jdg}
 */
public record Alert(AlertLevel level, String icon, String title, String text, String href) {
}
