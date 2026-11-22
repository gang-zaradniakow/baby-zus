package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.command.IssueAuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.LoginSettings;
import com.hn26.zaradniaki.zusbaby.identity.domain.SecretToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCodeRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.RedirectNotAllowedException;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class IssueAuthorizationCodeHandler implements Command.Handler<IssueAuthorizationCode, String> {

    private final AuthorizationCodeRepository codes;
    private final LoginSettings settings;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional
    public String handle(IssueAuthorizationCode command) {
        if (!settings.allows(command.redirectUri())) {
            throw new RedirectNotAllowedException();
        }
        SecretToken code = SecretToken.generate();
        codes.save(new AuthorizationCode(code.hash(), command.identity(), command.redirectUri(),
                dateTimeGenerator.now().plus(settings.codeTtl())));
        return code.value();
    }
}
