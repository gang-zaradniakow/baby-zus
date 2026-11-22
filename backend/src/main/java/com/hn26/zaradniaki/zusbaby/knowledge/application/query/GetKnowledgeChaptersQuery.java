package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ChapterDto;
import java.util.List;

/** Chapters of the guide with the summaries of their articles. */
public record GetKnowledgeChaptersQuery() implements Command<List<ChapterDto>> {
}
