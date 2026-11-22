package com.hn26.zaradniaki.zusbaby.identity.application.command;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import jakarta.validation.constraints.NotBlank;

/**
 * Exchange the one-time code for tokens; the first login creates the account.
 */
public record ExchangeAuthorizationCode(@NotBlank String code, @NotBlank String redirectUri)
        implements
            Command<IssuedTokensDto> {
}
