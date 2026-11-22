package com.hn26.zaradniaki.zusbaby.identity.application.command;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Voidy;
import jakarta.validation.constraints.NotBlank;

/** Revoke the refresh token; an unknown or revoked one is ignored. */
public record Logout(@NotBlank String refreshToken) implements Command<Voidy> {
}
