package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import java.util.List;

/** Facts for the "Did you know" box. */
public record GetFactsQuery() implements Command<List<String>> {
}
