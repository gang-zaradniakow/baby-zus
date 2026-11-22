package com.hn26.zaradniaki.zusbaby.identity.application.command;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import jakarta.validation.constraints.NotBlank;

/** New tokens for an active refresh token, which stops working. */
public record RefreshTokens(@NotBlank String refreshToken) implements Command<IssuedTokensDto> {
}
