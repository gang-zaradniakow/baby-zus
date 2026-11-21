package com.hn26.archfixtures.good.application.query;

import an.awesome.pipelinr.Command;
import org.springframework.transaction.annotation.Transactional;

class GetChildHandler implements Command.Handler<GetChild, String> {

    @Override
    @Transactional(readOnly = true)
    public String handle(GetChild query) {
        return query.id();
    }
}
