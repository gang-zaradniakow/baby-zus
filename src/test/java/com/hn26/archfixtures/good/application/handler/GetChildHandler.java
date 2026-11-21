package com.hn26.archfixtures.good.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.archfixtures.good.application.query.GetChildQuery;
import org.springframework.transaction.annotation.Transactional;

class GetChildHandler implements Command.Handler<GetChildQuery, String> {

    @Override
    @Transactional(readOnly = true)
    public String handle(GetChildQuery query) {
        return query.id();
    }
}
