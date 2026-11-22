package com.hn26.zaradniaki.zusbaby.identity.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.LoginRedirectDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Where to send the browser to log in. */
public record StartLoginQuery(@NotBlank String redirectUri, @NotBlank @Size(max = 200) String state)
        implements
            Command<LoginRedirectDto> {
}
