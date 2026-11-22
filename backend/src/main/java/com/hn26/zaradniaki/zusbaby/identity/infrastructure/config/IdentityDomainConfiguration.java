package com.hn26.zaradniaki.zusbaby.identity.infrastructure.config;

import com.hn26.zaradniaki.zusbaby.identity.domain.LoginSettings;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.AccessTokenIssuer;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshTokenRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.TokenPairIssuer;
import com.hn26.zaradniaki.zusbaby.identity.infrastructure.security.IdentityProperties;
import java.util.Set;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Framework-free domain services of the identity module as beans. */
@Configuration
class IdentityDomainConfiguration {

    @Bean
    LoginSettings loginSettings(IdentityProperties properties) {
        return new LoginSettings(properties.codeTtl(), properties.accessTokenTtl(), properties.refreshTokenTtl(),
                Set.copyOf(properties.allowedRedirectUris()));
    }

    @Bean
    TokenPairIssuer tokenPairIssuer(AccessTokenIssuer accessTokens, RefreshTokenRepository refreshTokens,
            LoginSettings settings) {
        return new TokenPairIssuer(accessTokens, refreshTokens, settings);
    }
}
