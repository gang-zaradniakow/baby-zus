package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.LoginRedirectDto;
import com.hn26.zaradniaki.zusbaby.identity.application.query.StartLoginQuery;
import com.hn26.zaradniaki.zusbaby.identity.domain.LoginSettings;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.IdentityProvider;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.RedirectNotAllowedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class StartLoginHandler implements Command.Handler<StartLoginQuery, LoginRedirectDto> {

    private final IdentityProvider identityProvider;
    private final LoginSettings settings;

    @Override
    @Transactional(readOnly = true)
    public LoginRedirectDto handle(StartLoginQuery query) {
        if (!settings.allows(query.redirectUri())) {
            throw new RedirectNotAllowedException();
        }
        return new LoginRedirectDto(identityProvider.loginPage(query.redirectUri(), query.state()));
    }
}
