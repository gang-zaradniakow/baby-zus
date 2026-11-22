package com.hn26.archfixtures.bad.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.archfixtures.bad.application.query.WritingQuery;
import org.springframework.transaction.annotation.Transactional;

/**
 * Violations: query handler in a read-write transaction, named *QueryHandler
 * instead of *Handler.
 */
class WritingQueryHandler implements Command.Handler<WritingQuery, String> {

    @Override
    @Transactional
    public String handle(WritingQuery query) {
        return "";
    }
}
