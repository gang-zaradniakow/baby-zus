package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleSummaryDto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Articles whose title, lead or text contains the phrase, ignoring case and
 * Polish diacritics. Surrounding whitespace of the phrase does not count.
 */
public record SearchKnowledgeQuery(@NotNull @Size(min = 2, max = 100) String phrase)
        implements
            Command<List<ArticleSummaryDto>> {

    public SearchKnowledgeQuery {
        phrase = phrase == null ? null : phrase.strip();
    }
}
