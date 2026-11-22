package com.hn26.zaradniaki.zusbaby.identity.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.IdentityApi;
import com.hn26.zaradniaki.zusbaby.api.model.CurrentUserDto;
import com.hn26.zaradniaki.zusbaby.api.model.ProblemDetailDto;
import com.hn26.zaradniaki.zusbaby.api.model.RefreshRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.TokenRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.TokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.command.ExchangeAuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.application.command.Logout;
import com.hn26.zaradniaki.zusbaby.identity.application.command.RefreshTokens;
import com.hn26.zaradniaki.zusbaby.identity.application.query.GetCurrentUserQuery;
import com.hn26.zaradniaki.zusbaby.identity.application.query.StartLoginQuery;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequiredArgsConstructor
class IdentityController implements IdentityApi {

    private final Pipeline pipeline;
    private final IdentityWebMapper mapper;

    @Override
    public ResponseEntity<ProblemDetailDto> authorizeWithMObywatel(String redirectUri, String state) {
        String loginPage = pipeline.send(new StartLoginQuery(redirectUri, state)).loginPage();
        // absolute, with the proxy's path prefix (X-Forwarded-Prefix)
        URI location = URI
                .create(ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString() + loginPage);
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    @Override
    public ResponseEntity<TokensDto> exchangeAuthorizationCode(TokenRequestDto request) {
        return ResponseEntity.ok(mapper.toResponse(
                pipeline.send(new ExchangeAuthorizationCode(request.getCode(), request.getRedirectUri()))));
    }

    @Override
    public ResponseEntity<TokensDto> refreshTokens(RefreshRequestDto request) {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new RefreshTokens(request.getRefreshToken()))));
    }

    @Override
    public ResponseEntity<Void> logout(RefreshRequestDto request) {
        pipeline.send(new Logout(request.getRefreshToken()));
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<CurrentUserDto> getCurrentUser() {
        // /api/v1/me is reachable only with a valid access token, whose subject is the
        // user id
        UUID userId = UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new GetCurrentUserQuery(userId))));
    }
}
