package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.SupportContactsDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.DictionaryDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetSupportContactsQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetSupportContactsHandler implements Command.Handler<GetSupportContactsQuery, SupportContactsDto> {

    private final DictionaryCatalog catalog;
    private final DictionaryDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public SupportContactsDto handle(GetSupportContactsQuery query) {
        return mapper.toSupportContacts(catalog.organizations(), catalog.helplines(), catalog.links());
    }
}
