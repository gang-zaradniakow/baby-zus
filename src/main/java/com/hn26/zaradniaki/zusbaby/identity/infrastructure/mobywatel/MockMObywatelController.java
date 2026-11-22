package com.hn26.zaradniaki.zusbaby.identity.infrastructure.mobywatel;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.identity.application.command.IssueAuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Login page of the mock mObywatel (the identity provider's screen, so outside
 * the API contract): the person picks a demo persona or a new user and is sent
 * back to the frontend with a one-time code.
 */
@Controller
@RequiredArgsConstructor
class MockMObywatelController {

    static final String NEW_USER = "new";
    private static final String NEW_USER_PREFIX = "demo-";

    private final Pipeline pipeline;

    @GetMapping(MockMObywatelIdentityProvider.LOGIN_PAGE)
    String loginPage(@RequestParam("redirect_uri") String redirectUri, @RequestParam String state, Model model) {
        model.addAttribute("personas", MockPersonas.ALL);
        model.addAttribute("redirectUri", redirectUri);
        model.addAttribute("state", state);
        model.addAttribute("newUser", NEW_USER);
        return "mock/mobywatel-login";
    }

    @PostMapping(MockMObywatelIdentityProvider.LOGIN_PAGE)
    String login(@RequestParam String persona, @RequestParam("redirect_uri") String redirectUri,
            @RequestParam String state) {
        Identity identity = NEW_USER.equals(persona)
                ? new Identity(NEW_USER_PREFIX + UUID.randomUUID(), null, null)
                : MockPersonas.byId(persona).map(MockPersona::identity)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown persona"));
        String code = pipeline.send(new IssueAuthorizationCode(identity, redirectUri));
        return "redirect:" + UriComponentsBuilder.fromUriString(redirectUri).queryParam("code", code)
                .queryParam("state", state).encode().build().toUriString();
    }
}
