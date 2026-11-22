package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.command.ExchangeAuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.mapper.IdentityDtoMapper;
import com.hn26.zaradniaki.zusbaby.identity.domain.InvalidGrantException;
import com.hn26.zaradniaki.zusbaby.identity.domain.SecretToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccountRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCodeRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.TokenPairIssuer;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class ExchangeAuthorizationCodeHandler implements Command.Handler<ExchangeAuthorizationCode, IssuedTokensDto> {

    private final AuthorizationCodeRepository codes;
    private final UserAccountRepository accounts;
    private final TokenPairIssuer tokens;
    private final IdentityDtoMapper mapper;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional(noRollbackFor = InvalidGrantException.class)
    public IssuedTokensDto handle(ExchangeAuthorizationCode command) {
        Instant now = dateTimeGenerator.now();
        // taken even when invalid: a code is never accepted twice
        AuthorizationCode code = codes.take(SecretToken.hashOf(command.code()))
                .filter(candidate -> candidate.isValidFor(command.redirectUri(), now))
                .orElseThrow(InvalidGrantException::new);
        UserAccount account = accounts.findBySubject(code.identity().subject()).orElseGet(() -> {
            UserAccount registered = UserAccount.register(code.identity(), now);
            accounts.save(registered);
            return registered;
        });
        return mapper.toDto(tokens.issue(account, now));
    }
}
