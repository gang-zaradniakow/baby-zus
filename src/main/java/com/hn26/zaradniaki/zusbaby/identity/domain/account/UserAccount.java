package com.hn26.zaradniaki.zusbaby.identity.domain.account;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Account of a person who logged in at least once.
 * @param id identifier used in tokens and by other modules
 * @param identity who it is
 * @param roles what the user may do
 * @param createdAt first login
 */
public record UserAccount(UUID id, Identity identity, Set<Role> roles, Instant createdAt) {

    public UserAccount {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(identity, "identity");
        Objects.requireNonNull(createdAt, "createdAt");
        roles = Set.copyOf(roles.isEmpty() ? EnumSet.noneOf(Role.class) : EnumSet.copyOf(roles));
    }

    /** Account created at the first login, with the user role. */
    public static UserAccount register(Identity identity, Instant now) {
        return new UserAccount(UUID.randomUUID(), identity, Set.of(Role.USER), now);
    }
}
