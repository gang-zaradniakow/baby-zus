package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFactsQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetFactsHandler implements Command.Handler<GetFactsQuery, List<String>> {

    private final DictionaryCatalog catalog;

    @Override
    @Transactional(readOnly = true)
    public List<String> handle(GetFactsQuery query) {
        return catalog.facts();
    }
}
