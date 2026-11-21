package com.hn26.archfixtures.bad.service;

import an.awesome.pipelinr.Command;
import com.hn26.archfixtures.bad.application.query.WritingQuery;
import org.springframework.transaction.annotation.Transactional;

/** Violation: handler outside application.command / application.query. */
class OrphanHandler implements Command.Handler<WritingQuery, String> {

    @Override
    @Transactional(readOnly = true)
    public String handle(WritingQuery query) {
        return "";
    }
}
