package com.hn26.zaradniaki.zusbaby.golden;

/**
 * One case computed by the frontend prototype: the input given to its function
 * and the result it returned.
 * @param <I> input type
 * @param <E> expected result type
 */
public record GoldenCase<I, E>(String name, I input, E expected) {

    /** Shown as the name of the parameterized test. */
    @Override
    public String toString() {
        return name;
    }
}
