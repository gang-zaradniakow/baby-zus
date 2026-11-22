package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

/**
 * Chapter of the guide for parents.
 * @param id stable identifier used in links
 * @param title Polish title
 * @param icon name of the frontend icon
 * @param lead one-sentence introduction
 */
public record Chapter(String id, String title, String icon, String lead) {
}
