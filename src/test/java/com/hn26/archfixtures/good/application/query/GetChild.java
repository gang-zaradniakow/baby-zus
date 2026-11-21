package com.hn26.archfixtures.good.application.query;

import an.awesome.pipelinr.Command;

public record GetChild(String id) implements Command<String> {
}
