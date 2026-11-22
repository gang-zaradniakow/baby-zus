package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.FormDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.DictionaryDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFormsQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetFormsHandler implements Command.Handler<GetFormsQuery, List<FormDto>> {

    private final DictionaryCatalog catalog;
    private final DictionaryDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<FormDto> handle(GetFormsQuery query) {
        return mapper.toForms(catalog.forms());
    }
}
