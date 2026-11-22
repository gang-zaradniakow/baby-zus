package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Voidy;
import com.hn26.zaradniaki.zusbaby.identity.application.command.Logout;
import com.hn26.zaradniaki.zusbaby.identity.domain.SecretToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshTokenRepository;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class LogoutHandler implements Command.Handler<Logout, Voidy> {

    private final RefreshTokenRepository refreshTokens;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional
    public Voidy handle(Logout command) {
        refreshTokens.findByHash(SecretToken.hashOf(command.refreshToken()))
                .ifPresent(token -> refreshTokens.save(token.revoked(dateTimeGenerator.now())));
        return new Voidy();
    }
}
