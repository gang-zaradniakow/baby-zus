package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.command.RefreshTokens;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.mapper.IdentityDtoMapper;
import com.hn26.zaradniaki.zusbaby.identity.domain.InvalidGrantException;
import com.hn26.zaradniaki.zusbaby.identity.domain.SecretToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccountRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshTokenRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.TokenPairIssuer;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class RefreshTokensHandler implements Command.Handler<RefreshTokens, IssuedTokensDto> {

    private final RefreshTokenRepository refreshTokens;
    private final UserAccountRepository accounts;
    private final TokenPairIssuer tokens;
    private final IdentityDtoMapper mapper;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional
    public IssuedTokensDto handle(RefreshTokens command) {
        Instant now = dateTimeGenerator.now();
        RefreshToken current = refreshTokens.findByHash(SecretToken.hashOf(command.refreshToken()))
                .filter(token -> token.isActive(now)).orElseThrow(InvalidGrantException::new);
        UserAccount account = accounts.findById(current.userId()).orElseThrow(InvalidGrantException::new);
        refreshTokens.save(current.revoked(now));
        return mapper.toDto(tokens.issue(account, now));
    }
}
