package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.FormDto;
import java.util.List;

/** Glossary of ZUS forms. */
public record GetFormsQuery() implements Command<List<FormDto>> {
}
