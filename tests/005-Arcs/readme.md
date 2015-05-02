#Readme for arcs

##Setup / General
- Set up Atom according to this page: https://github.com/synthetos/g2/wiki/Using-Atom
- It's often a good idea to hit reset before starting a test run
- If the test gets stuck you can ^c to get out of it (usually twice)

##YAML Hygiene
- The yaml linter will give you a red squiggly if you got it wrong
- Use js-yaml to see the JSON or report errors
- The yaml is very sensitive to indentation
  - Make sure all struct line up properly. Use the indent helper in Atom
  - You can also screw up the structure like this:
    - Correct:
    ```
      testResult:
        text: CW 360 degree circle in XY
        endPosition:
          x: 100
          y: 100
        status: ${stat.stop}
    ```
    - Incorrect: status erroneously becomes part of endPosition obj
    ```
      testResult:
        text: CW 360 degree circle in XY
        endPosition:
          x: 100
          y: 100
          status: ${stat.stop}
    ```

## USAGE: About YAML in the Test Definitions

### testSuiteMetadata:
- variables:
  - Variables can be substituted later in the tests
    - substitute as ${variablename}
  - can be in a flatnamespace, like the feedRate: variable
    - invoke as ${}
  - can be nested, like status
  - status: is the return code from response footer {f:[1,0,20]}
  - stat: is the machine status from the SR "stat:" element

### tests:
- timeout:
  - is in seconds
  - allow enough time to answer the manual question
- text:
  - if present will display
- endPosition
  - checks the end position for one or more axes in the status report returning the STOP stat.
  - omit any axes you don't want to check
  - omit the entire endPosition element to not check any axes
