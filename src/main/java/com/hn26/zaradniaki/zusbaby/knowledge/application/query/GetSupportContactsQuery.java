package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.SupportContactsDto;

/** Support organisations, helplines and useful pages. */
public record GetSupportContactsQuery() implements Command<SupportContactsDto> {
}
