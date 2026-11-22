package com.hn26.zaradniaki.zusbaby.knowledge.application.exception;

import com.hn26.zaradniaki.zusbaby.shared.domain.NotFoundException;

/** No article with the requested identifier. */
public class ArticleNotFoundException extends NotFoundException {

    public static final String CODE = "article-not-found";

    public ArticleNotFoundException() {
        super(CODE, "Nie znaleźliśmy tego artykułu. Wróć do listy rozdziałów.");
    }
}
