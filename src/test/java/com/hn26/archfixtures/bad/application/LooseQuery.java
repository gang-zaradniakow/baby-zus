package com.hn26.archfixtures.bad.application;

import an.awesome.pipelinr.Command;

/** Violation: query outside a query package. */
public record LooseQuery() implements Command<String> {
}
