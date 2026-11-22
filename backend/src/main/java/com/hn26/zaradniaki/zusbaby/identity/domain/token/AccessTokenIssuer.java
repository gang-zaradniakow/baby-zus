package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import java.time.Instant;

/** Port: signed access tokens (JWT) of a user. */
public interface AccessTokenIssuer {

    /** Token valid from {@code now} for the configured time. */
    String issue(UserAccount account, Instant now);
}
