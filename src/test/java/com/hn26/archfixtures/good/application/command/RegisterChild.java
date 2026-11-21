package com.hn26.archfixtures.good.application.command;

import an.awesome.pipelinr.Command;

public record RegisterChild(String name) implements Command<String> {
}
