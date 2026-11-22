package com.hn26.archfixtures.bad.application.command;

import an.awesome.pipelinr.Command;

/** Violation: a command that is not a record. */
public class MutableCommand implements Command<String> {
}
