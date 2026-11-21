package com.hn26.archfixtures.bad.application.query;

import an.awesome.pipelinr.Command;

/** Violation: query whose name does not end with "Query". */
public record FetchReport() implements Command<String> {
}
