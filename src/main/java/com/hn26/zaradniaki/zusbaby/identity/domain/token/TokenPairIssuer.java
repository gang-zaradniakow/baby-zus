package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import com.hn26.zaradniaki.zusbaby.identity.domain.LoginSettings;
import com.hn26.zaradniaki.zusbaby.identity.domain.SecretToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import java.time.Instant;
import java.util.Objects;

/** Issues an access token and a new refresh token for a user. */
public final class TokenPairIssuer {

    private final AccessTokenIssuer accessTokens;
    private final RefreshTokenRepository refreshTokens;
    private final LoginSettings settings;

    public TokenPairIssuer(AccessTokenIssuer accessTokens, RefreshTokenRepository refreshTokens,
            LoginSettings settings) {
        this.accessTokens = Objects.requireNonNull(accessTokens, "accessTokens");
        this.refreshTokens = Objects.requireNonNull(refreshTokens, "refreshTokens");
        this.settings = Objects.requireNonNull(settings, "settings");
    }

    public IssuedTokens issue(UserAccount account, Instant now) {
        SecretToken refresh = SecretToken.generate();
        refreshTokens.save(RefreshToken.issue(account.id(), refresh.hash(), now.plus(settings.refreshTokenTtl())));
        return new IssuedTokens(accessTokens.issue(account, now), settings.accessTokenTtl(), refresh.value(),
                settings.refreshTokenTtl());
    }
}
