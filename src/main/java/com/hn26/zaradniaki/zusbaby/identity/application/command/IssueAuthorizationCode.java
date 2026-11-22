package com.hn26.zaradniaki.zusbaby.identity.application.command;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * After a login at the identity provider: issue a one-time code for the
 * frontend at {@code redirectUri}; returns the code.
 */
public record IssueAuthorizationCode(@NotNull Identity identity, @NotBlank String redirectUri)
        implements
            Command<String> {
}
