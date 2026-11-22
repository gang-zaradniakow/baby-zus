package com.hn26.zaradniaki.zusbaby.identity.infrastructure.mobywatel;

import com.hn26.zaradniaki.zusbaby.identity.domain.login.IdentityProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Adapter of the {@link IdentityProvider} port: the mock login page of this
 * backend.
 */
@Component
class MockMObywatelIdentityProvider implements IdentityProvider {

    static final String LOGIN_PAGE = "/api/v1/mock/mobywatel/login";

    @Override
    public String loginPage(String redirectUri, String state) {
        return UriComponentsBuilder.fromPath(LOGIN_PAGE).queryParam("redirect_uri", redirectUri)
                .queryParam("state", state).encode().build().toUriString();
    }
}
