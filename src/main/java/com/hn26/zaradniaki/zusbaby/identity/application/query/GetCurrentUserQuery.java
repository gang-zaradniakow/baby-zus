package com.hn26.zaradniaki.zusbaby.identity.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.UserDto;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** The user of an access token. */
public record GetCurrentUserQuery(@NotNull UUID userId) implements Command<UserDto> {
}
