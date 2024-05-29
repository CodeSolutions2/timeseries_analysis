# run_GitHub_Actions

The purpose of this repository is to serve as a way to start backend processes on GitHub Actions. Using the JavaScript functions in [library_to_run_GitHub_Actions.html](https://github.com/CodeSolutions2/.github/blob/main/library_to_run_GitHub_Actions.html) in any repository, one can create files in this repository containing input from any FrontEnd application. The created files containing the FrontEnd application inputs/data, trigger GitHub Action workflows (on the BackEnd) that automatically process the data in the file/s. The repository that runs the JavaScript functions inside the "library_to_run_GitHub_Actions.html" script, should have a GitHub Action workflow that monitors the change of a specific file name (ie: temp) inside the run_GitHub_Actions repository.

## Steps to set-up a repository like run_GitHub_Actions:
a. Create a public repository (I named it run_GitHub_Actions)
b. Create fine-grained personal access token: Settings - create fine-grained personal access token (follow the steps at [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens))
- Repository Access: only select repositories - select repositories -  CodeSolutions2/run_GitHub_Actions
    - Permissions: 
        - Repository permissions - Contents (Read and Write), Metadata (Read)
        - Organization permission: none

c. Setup Organization verification of token: Settings - Your Organizations (left bar changes to Organizations) - Settings - (on left bar) Personal access tokens - Settings
  - Fine-grained personal access tokens: Allow access via fine-grained personal access tokens 
  - Require approval of fine-grained personal access tokens : Require administrator approval 
  - Personal access token (classic) : Allow access via personal access tokens (classic) 

d. Copy and save the key somewhere safe only for you. 

e. Salt the key (concept about salting: https://en.wikipedia.org/wiki/Salt_%28cryptography%29)
    - Add 1 to n extra characters to the beginning or end of the key (n=1 or 2)

f. Create an invisible .env file inside an invisible .github folder in the public repository (run_GitHub_Actions), to put the encoded salted key.

g. Base64_encode the salted key. Use my base64_encode webapp (https://github.com/CodeSolutions2/secure_encryption_of_data) to encode the [salted key]

h. Copy-paste the base64_encoded salted key into [run_GitHub_Actions - .github - .env]
