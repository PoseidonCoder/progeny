# progeny

a minimalist, clean programming language

## Example (reference implementation)

```
array = [1, 2, 3, 4, 5] # ARRAYS
show length(array)

for number in array {    # FOR LOOPS
    show number
}

object = {              # OBJECTS
    {name: "lukas"}: "person",
    {name: "winnie"}: "dog"
}

show object[{
    name: "lukas"
}]

bool = true             # BOOLEANS
show bool

number = 1              # NUMBERS
if number is 1 {        # IF STATEMENTS
    show "number is 1!"
}

function add(a, b) {    # FUNCTIONS
    return a + b        # RETURNING
}
show add(1, 2)
```

## Techincal definition

Progeny is a multi-paradigm procedural, functional, programming language
