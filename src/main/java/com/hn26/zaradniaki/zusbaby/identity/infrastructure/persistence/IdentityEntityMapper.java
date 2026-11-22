package com.hn26.zaradniaki.zusbaby.identity.infrastructure.persistence;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.Role;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshToken;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Domain ↔ JPA entities. */
@Mapper(config = MapStructConfig.class)
interface IdentityEntityMapper {

    @Mapping(target = "subject", source = "identity.subject")
    @Mapping(target = "personaId", source = "identity.personaId")
    @Mapping(target = "displayName", source = "identity.displayName")
    UserAccountEntity toEntity(UserAccount account);

    @Mapping(target = "identity", expression = "java(identity(entity.getSubject(), entity.getPersonaId(), entity.getDisplayName()))")
    UserAccount toDomain(UserAccountEntity entity);

    @Mapping(target = "subject", source = "identity.subject")
    @Mapping(target = "personaId", source = "identity.personaId")
    @Mapping(target = "displayName", source = "identity.displayName")
    AuthorizationCodeEntity toEntity(AuthorizationCode code);

    @Mapping(target = "identity", expression = "java(identity(entity.getSubject(), entity.getPersonaId(), entity.getDisplayName()))")
    AuthorizationCode toDomain(AuthorizationCodeEntity entity);

    RefreshTokenEntity toEntity(RefreshToken token);

    // revoked(Instant) of the record looks like a fluent setter to MapStruct
    @Mapping(target = "revoked", ignore = true)
    RefreshToken toDomain(RefreshTokenEntity entity);

    default Identity identity(String subject, String personaId, String displayName) {
        return new Identity(subject, personaId, displayName);
    }

    default String[] toNames(Set<Role> roles) {
        return roles.stream().map(Role::name).sorted().toArray(String[]::new);
    }

    default Set<Role> toRoles(String[] names) {
        return Arrays.stream(names).map(Role::valueOf).collect(Collectors.toSet());
    }
}
