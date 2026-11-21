package com.hn26.archfixtures.bad.application.query;

import an.awesome.pipelinr.Command;
import org.springframework.transaction.annotation.Transactional;

/** Violation: query handler in a read-write transaction. */
class WritingQueryHandler implements Command.Handler<WritingQuery, String> {

    @Override
    @Transactional
    public String handle(WritingQuery query) {
        return "";
    }
}
