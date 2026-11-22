package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.DictionaryDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetWeekCardsQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetWeekCardsHandler implements Command.Handler<GetWeekCardsQuery, WeekCardsDto> {

    private final DictionaryCatalog catalog;
    private final DictionaryDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public WeekCardsDto handle(GetWeekCardsQuery query) {
        return mapper.toDto(catalog.weekCards());
    }
}
