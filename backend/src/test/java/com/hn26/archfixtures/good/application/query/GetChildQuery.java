package com.hn26.archfixtures.good.application.query;

import an.awesome.pipelinr.Command;

public record GetChildQuery(String id) implements Command<String> {
}
