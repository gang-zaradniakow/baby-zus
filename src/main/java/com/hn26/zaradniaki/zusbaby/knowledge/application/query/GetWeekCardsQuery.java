package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;

/** Cards of the week for pregnancy and for the child. */
public record GetWeekCardsQuery() implements Command<WeekCardsDto> {
}
