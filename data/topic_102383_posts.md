# Discourse Topic Posts

## Post #1 by jonathandekhtiar

**Created:** 2025-08-14T15:02:04.966Z  
**Replies:** 2 | **Reads:** 241



---

## Post #2 by notatallshaw

**Created:** 2025-08-14T15:58:31.112Z  
**Replies:** 4 | **Reads:** 193



---

## Post #3 by AA-Turner

**Created:** 2025-08-14T16:11:58.415Z  
**Replies:** 0 | **Reads:** 187



---

## Post #4 by jonathandekhtiar

**Created:** 2025-08-14T16:16:13.440Z  
**Replies:** 3 | **Reads:** 180



---

## Post #5 by davidism

**Created:** 2025-08-14T16:27:48.845Z  
**Replies:** 3 | **Reads:** 174



---

## Post #6 by notatallshaw

**Created:** 2025-08-14T16:29:27.785Z  
**Replies:** 0 | **Reads:** 172



---

## Post #7 by AA-Turner

**Created:** 2025-08-14T16:37:08.961Z  
**Replies:** 0 | **Reads:** 170



---

## Post #8 by jonathandekhtiar

**Created:** 2025-08-14T16:37:16.847Z  
**Replies:** 2 | **Reads:** 169



---

## Post #9 by bwoodsend

**Created:** 2025-08-14T16:57:24.908Z  
**Replies:** 0 | **Reads:** 171



---

## Post #10 by steve.dower

**Created:** 2025-08-14T17:10:37.658Z  
**Replies:** 2 | **Reads:** 162



---

## Post #11 by notatallshaw

**Created:** 2025-08-14T17:12:27.078Z  
**Replies:** 0 | **Reads:** 166



---

## Post #12 by mikeshardmind

**Created:** 2025-08-14T17:20:33.488Z  
**Replies:** 0 | **Reads:** 158



---

## Post #13 by zanie

**Created:** 2025-08-14T17:20:46.904Z  
**Replies:** 4 | **Reads:** 160



---

## Post #14 by AA-Turner

**Created:** 2025-08-14T17:27:47.194Z  
**Replies:** 1 | **Reads:** 155



---

## Post #15 by mgorny

**Created:** 2025-08-14T17:28:31.847Z  
**Replies:** 1 | **Reads:** 159



---

## Post #16 by pf_moore

**Created:** 2025-08-14T17:28:45.140Z  
**Replies:** 3 | **Reads:** 163



---

## Post #17 by pf_moore

**Created:** 2025-08-14T17:32:38.062Z  
**Replies:** 0 | **Reads:** 152



---

## Post #18 by zanie

**Created:** 2025-08-14T17:37:09.414Z  
**Replies:** 1 | **Reads:** 154



---

## Post #19 by AA-Turner

**Created:** 2025-08-14T17:38:30.386Z  
**Replies:** 1 | **Reads:** 158



---

## Post #20 by ncoghlan

**Created:** 2025-08-14T17:41:50.871Z  
**Replies:** 0 | **Reads:** 162



---

## Post #21 by charliermarsh

**Created:** 2025-08-14T17:51:25.684Z  
**Replies:** 0 | **Reads:** 151

[quote="pf_moore, post:16, topic:102383"]
I’m somewhat concerned that so far this proposal has not been discussed at all on Discourse. While the concern may have been “well discussed in other forums” I don’t want the discussion here to be based on an edited or summarised version of discussions that have happened elsewhere. Packaging standards are based on a consensus-driven process, and when significant parts of a proposal’s design happens outside of this forum, that consensus based process is at risk. If nothing else, there’s going to be an understandable reluctance to entertain significant changes to the proposal because of the amount of effort already invested in what you have.

[/quote]

I totally understand this feeling, but (at least from my perspective) there is definitely an expectation and an understanding that the proposal may have to change, and perhaps significantly (if it’s ever accepted). The initial wheel variant proposals were discussed on Discourse (and then at the Packaging Summit at PyCon, though I understand that that’s also not-Discourse), and what’s happened since then is we effectively took those ideas and pulled them into a working, experimental design. We learned a *lot* by building that prototype that we may not have learned through discussion alone (we ran into unforeseen problems, e.g., around lockfiles; the design changed a lot; etc.). I think the design is much stronger for it, and there’s now proof that it can work for real, complex packages (like PyTorch). But this isn’t meant to be the “conclusion” of the design process, just a continuation.

---

## Post #22 by notatallshaw

**Created:** 2025-08-14T17:59:27.054Z  
**Replies:** 2 | **Reads:** 144

[quote="zanie, post:13, topic:102383"]
To clarify the language a little… I think there’s some missing nuance between installing *a* wheel and selecting *which* wheel to install. In this proposal, the former still doesn’t require execution of third-party code, while the latter does by default.

[/quote]

Is that always true?

If I have an arbitrary wheel that has been downloaded and I’m trying to install in an arbitrary environment, and that wheel has variant metadata, shouldn’t the installer validate, by default, validate that wheel variant metadata matches that environment? And in that case doesn’t that require running the variant plugin code?

---

## Post #23 by notatallshaw

**Created:** 2025-08-14T18:09:09.565Z  
**Replies:** 1 | **Reads:** 147

[quote="notatallshaw, post:22, topic:102383"]
If I have an arbitrary wheel that has been downloaded and I’m trying to install in an arbitrary environment, and that wheel has variant metadata, shouldn’t the installer validate, by default, validate that wheel variant metadata matches that environment? And in that case doesn’t that require running the variant plugin code?

[/quote]

Sorry for the two quick replies, but I just wanted to add I guess that’s technically choosing whether to “select” the wheel or not, but it’s really close to being hard to distinguish for most users, I think, between arbitrary code for selection, and arbitrary code for installation. (As evidenced by how I just got myself confused on this point).

---

## Post #24 by zanie

**Created:** 2025-08-14T18:12:45.299Z  
**Replies:** 1 | **Reads:** 150

[quote="notatallshaw, post:22, topic:102383"]
Is that always true?

If I have an arbitrary wheel that has been downloaded and I’m trying to install in an arbitrary environment, and that wheel has variant metadata, shouldn’t the installer validate, by default, validate that that wheel matches variant metadata matches that environment? And in that case doesn’t that require running the variant plugin code?

[/quote]

That’s a great question! I’m not sure honestly.

I think the specification should speak to this, e.g. “Installers <MUST|SHOULD|SHOULD NOT|MUST NOT> validate that a requested wheel’s variants are compatible with the current machine”. Given the discussion here, I think “SHOULD NOT” is the recommendation? I don’t think “MUST NOT” is appropriate though.

In my comment, I assumed that `pip install <filename>.whl` would not validate that the variant is usable, but it is fair to say that tools will probably want to provide some sort of hint if you’re installing a variant that won’t work on your machine.

[quote="notatallshaw, post:23, topic:102383"]
I just wanted to add I guess that’s technically choosing whether to “select” the wheel or not, but it’s really close to being hard to distinguish for most users, I think, between arbitrary code for selection, and arbitrary code for installation.

[/quote]

I think the difference would be asking to install `<filename>.whl` vs `<package-name>`. Maybe there are more cases I’m not considering though.

---

## Post #25 by jonathandekhtiar

**Created:** 2025-08-14T18:15:32.912Z  
**Replies:** 1 | **Reads:** 148

[quote="zanie, post:24, topic:102383"]
That’s a great question! I’m not sure honestly.

I think the specification should speak to this, e.g. “Installers <MUST|SHOULD|SHOULD NOT|MUST NOT> validate that a requested wheel’s variants are compatible with the current machine”. Given the discussion here, I think “SHOULD NOT” is the recommendation? I don’t think “MUST NOT” is appropriate though.

In my comment, I assumed that `pip install <filename>.whl` would not validate that the variant is usable, but it is fair to say that tools will probably want to provide some sort of hint if you’re installing a variant that won’t work on your machine.

[/quote]

@zanie I can talk to the “current version” of what we are writing today.

Yes it’s always true.The variant mechanism is essentially “an add-on to the resolver logic”.
You don’t rerun the resolution if you execute `pip install my_package-…-any.whl` (only scan for dependencies).

Well I don’t see (today) any reason for variant to behave in any other way (would still need to resolve dependencies).

If you explicitly request something - we should trust you and assume you know what you do.

——-

We could change that assumption if requested by the community - but I have a feeling the community will agree it should not validate a user explicit request.

---

## Post #26 by steve.dower

**Created:** 2025-08-14T18:20:55.791Z  
**Replies:** 2 | **Reads:** 140

[quote="Zanie Blue, post:13, topic:102383, username:zanie"]
I feel like this would completely break package resolution?
[/quote]

As I went on to say after the end of the quoted text, this can apply _before_ resolution. So basically, as soon as `torch` enters the set of packages that needs to be resolved (and its first set of metadata is accessed), it's identified as "needs further resolution", which then determines that for the current platform it should be `torch_xy1234` instead. No interaction with other dependencies is needed - it's just a straight mapping that is specific to the current machine/configuration. Doesn't even need any version resolution - if the publisher doesn't release versions for every variant and the reference included a version (e.g. `torch>2.0`) then it may just _correctly_ fail to resolve..

If other dependencies specify a particular variant, then you'll get file conflicts, same as if you referred to two unrelated packages that write the same files. It can be dealt with in the same way. If other dependencies refer to the generic name, they get the same variant (i.e. cache the result).

[quote="Zanie Blue, post:13, topic:102383, username:zanie"]
Maybe it’s worth considering why we’re not using such a system for the existing platform tags?
[/quote]

Two reasons:
* platform tag is a singular tag, defined by the Python installation, whereas variants are multi-dimensional with the vast majority of packages not requiring any dimension at all
* we can't easily add another tag to the filenames now and have it be compatible, while we can publish new packages with new names very easily

---

## Post #27 by zanie

**Created:** 2025-08-14T18:30:52.987Z  
**Replies:** 1 | **Reads:** 142

[quote="steve.dower, post:26, topic:102383"]
As I went on to say after the end of the quoted text, this can apply *before* resolution. So basically, as soon as `torch` enters the set of packages that needs to be resolved (and its first set of metadata is accessed), it’s identified as “needs further resolution”, which then determines that for the current platform it should be `torch_xy1234` instead. No interaction with other dependencies is needed - it’s just a straight mapping that is specific to the current machine/configuration.

[/quote]

Sorry, I wasn’t trying to take your quote out of context.

I think the complicated part is universal resolution for lock files; e.g., when solving for all possible platforms how do we know what packages we need?

Wheel variants are also trying to address cases where there are multiple valid packages, e.g., if you’re on x86-64-v4 then `foo_x86-64-v4`is not the only valid package. It’s *preferred*, but if only `foo_x86-64-v2` is available then we should take that one. I’m not sure how tractable resolution is if we need to check for a bunch of separate packages — I think that could be addressed by changes to package metadata or the Simple API but then we’re increasing scope again.

Separately, I’m a little terrified of the security posture of this approach? I can squat `foo_x86-64-v4` even if I don’t own `foo` and someone who does `pip install foo` could pull the malicious package?

---

## Post #28 by notatallshaw

**Created:** 2025-08-14T18:35:36.833Z  
**Replies:** 1 | **Reads:** 140

[quote="jonathandekhtiar, post:25, topic:102383"]
If you explicitly request something - we should trust you and assume you know what you do.

[/quote]

That doesn’t match existing wheel behavior for most (all?) package installers, your platform and environment are validated:

```bash
C:\> pip install .\pandas-2.3.1-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
ERROR: pandas-2.3.1-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl is not a supported wheel on this platform.
```

IMO this validation behavior is correct, though happy for a force or override flag, it prevents users from breaking their environments accidentally (without it I would have broken my environment many times back in 2013 when I was first learning Python).

It would also surely be useful (needed?) for users building wheels and/or variant plugins, that they can install them locally and check the validation works?

---

## Post #29 by steve.dower

**Created:** 2025-08-14T18:44:00.107Z  
**Replies:** 4 | **Reads:** 136

[quote="Zanie Blue, post:27, topic:102383, username:zanie"]
I think the complicated part is universal resolution for lock files; e.g., when solving for all possible platforms how do we know what packages we need?
[/quote]

I don't think you can do universal resolution in a lock file. You _could_ lock all possibilities and integrate the selection logic (i.e. the arbitrary code) back into the installation logic, or (my preference) the package developer makes them all installable simultaneously (i.e. no conflicting filenames) and chooses at runtime.

[quote="Zanie Blue, post:27, topic:102383, username:zanie"]
Separately, I’m a little terrified of the security posture of this approach? I can squat `foo_x86-64-v4` even if I don’t own `foo` and someone who does `pip install foo` could pull the malicious package?
[/quote]

In my model, whoever owns `foo` chooses the names that it may resolve to. Either through metadata into a generic selector, or their own specific selector. But there isn't a generic set of variants that get looked up for any package at all - the `foo` package itself is published by the publisher, and it contains (metadata/code) the names it may be replaced by.

---

## Post #30 by ncoghlan

**Created:** 2025-08-14T19:03:33.055Z  
**Replies:** 3 | **Reads:** 134

[quote="Steve Dower, post:29, topic:102383, username:steve.dower"]
But there isn’t a generic set of variants that get looked up for any package at all - the `foo` package itself is published by the publisher, and it contains (metadata/code) the names it may be replaced by.
[/quote]

That's actually a pretty decent gist of how the variant proposal works.

What makes this particularly hard isn't selecting the variant for *one* project, it's selecting a *consistent* set of variants across *multiple* projects that need to match with each other on *multiple* dimensions.

So NumPy & SciPy need to match on the BLAS library they're built against. Everything with CUDA/ROCm variants need to match not only each other, but the hardware in the target machine (which may not be the machine where the environment is being put together). For CUDA at least (I'm not sure about ROCm) everything needs to be built against the *same* CUDA version. CPU instruction sets don't necessarily impose cross project compatibility issues, but can make a big difference in runtime performance.

Theoretically all those things *could* be encoded directly into distinct package names, but then you not only end up with horrendously complicated names, you also lose the "one sdist, many binaries" aspect of the proposal that aims to emphasise that the permitted degree of behavioural divergence between wheel variants is *lower* than what can be expected between wheel builds for different platforms, let alone between different versions of a project or between projects with different names.

---

## Post #31 by barry

**Created:** 2025-08-14T19:05:56.229Z  
**Replies:** 2 | **Reads:** 132

[quote="David Lord, post:5, topic:102383, username:davidism"]
Yes, if you need to *build* the wheel, there is code executed, but once you have the wheel you *know* it is statically installable.
[/quote]

Unfortunately, until pip defaults to [`--only-binary :all:`](https://github.com/pypa/pip/issues/9140) we can't guarantee that anyway.

---

## Post #32 by jonathandekhtiar

**Created:** 2025-08-14T19:07:17.585Z  
**Replies:** 1 | **Reads:** 134

Interesting. I guess you’re right we would not allow to install a MacOS Wheel on Linux. (And I don’t think we can force that if we wanted to for obscure reason). Is it possible to install an unsupported manylinux tag with some flag? 

Funny enough - the reason why we really **wanted** not to run the resolution if you ask for specific has to do with building containers or large scale deployments where the “builder” may not actually have the target hardware.

To address this scenario we thought about both:

* static “frozen resolution” : think about it like”pip freeze” but for variants. It would shortcut all plugins and guarantee a totally static and reproduceable install. No plugin. No code execution. Just run the resolver in the installer.
* Variant pinning (like for version ==A.B.C) but variant style (we are still debating what form we want that syntax to take.)

---

## Post #33 by davidism

**Created:** 2025-08-14T19:10:13.340Z  
**Replies:** 0 | **Reads:** 131

Talking only about wheels, you can guarantee no arbitrary code execution in order to determine what wheel (or sdist) to fetch, or to install the wheel once it’s fetched. Yes, to build the wheel from sdist is different, but you can restrict when and where that happens with existing tools.

---

## Post #34 by steve.dower

**Created:** 2025-08-14T19:13:03.102Z  
**Replies:** 3 | **Reads:** 133

[quote="Alyssa Coghlan, post:30, topic:102383, username:ncoghlan"]
What makes this particularly hard isn’t selecting the variant for *one* project, it’s selecting a *consistent* set of variants across *multiple* projects that need to match with each other on *multiple* dimensions.
[/quote]

I really don't see any alternative approach for this besides those projects actively trying to detect the same things, so they can reach the same conclusions independently (or alternatively, if a dependency from one to the other is involved, using a more specific dependency - e.g. `scipy_cpu` explicitly depends on `numpy_cpu`, rather than generic `numpy`). If a user is overriding the selector by choosing them directly, then explicit dependencies will be okay, or they'll just have to override more things.

In any case, the package developers are best placed to decide which build should be chosen for the set of dimensions that matter, and they _must_ reduce multiple dimensions down to a single selection. The biggest challenge is if we _need_ to factor in "other packages that are going to be installed at the same time", but that's going to become circular so quickly that I'm really inclined to just refuse.

Not every single scenario here has to be fully automatic. And especially on the publishing side - manual, predictable and stable usually turns out better in the long run than magical.

---

## Post #35 by zanie

**Created:** 2025-08-14T19:30:58.196Z  
**Replies:** 0 | **Reads:** 130

[quote="jonathandekhtiar, post:32, topic:102383"]
I guess you’re right we would not allow to install a MacOS Wheel on Linux. (And I don’t think we can force that if we wanted to for obscure reason). Is it possible to install an unsupported manylinux tag with some flag?

[/quote]

Yes, you can get around this — and there are valid use-cases, e.g., constructing an environment that you’re going to use on another platform.

```
$ uv pip install dist/example-0.1.0-py3-none-win_amd64.whl
  Resolved 3 packages in 2ms
  error: Failed to determine installation plan
  Caused by: A path dependency is incompatible with the current platform: dist/example-0.1.0-py3-none-win_amd64.whl

hint: The wheel is compatible with Windows (`win_amd64`), but you’re on macOS (`macosx_14_0_arm64`)

$ uv pip install dist/example-0.1.0-py3-none-win_amd64.whl --python-platform windows
Resolved 3 packages in 96ms
Prepared 1 package in 2ms
Installed 3 packages in 2ms

* example==0.1.0 (from file:///Users/zb/workspace/uv/example/dist/example-0.1.0-py3-none-win_amd64.whl)
* gunicorn==23.0.0
* packaging==25.0
```

---

## Post #36 by ncoghlan

**Created:** 2025-08-14T19:31:51.832Z  
**Replies:** 2 | **Reads:** 126

[quote="Steve Dower, post:34, topic:102383, username:steve.dower"]
In any case, the package developers are best placed to decide which build should be chosen for the set of dimensions that matter, and they *must* reduce multiple dimensions down to a single selection.
[/quote]

Yes, that's exactly what the wheel variant proposal enables.

It just *also* covers factoring out those variant selection decisions into named plugins so instead of each affected library needing to implement that logic independently they can instead just specify that they use the CUDA and ROCm variant selectors (for example).

Edit to clarify: and since we don't want to hard code a specific supported set of variant dimensions, the selector plugins get identified via PyPI project names.

---

## Post #37 by steve.dower

**Created:** 2025-08-14T19:40:02.336Z  
**Replies:** 1 | **Reads:** 122

[quote="Alyssa Coghlan, post:36, topic:102383, username:ncoghlan"]
they can instead just specify that they use the CUDA and ROCm variant selectors (for example).
[/quote]

Yeah, I'm happy to be proven wrong (doubtful anyone's going to _argue_ me wrong), but I'm pretty sure this won't scale. It's in a theoretically nice middle ground, but in practice I'd expect either "fully built into with the installer tool" or "fully determined by code in the package" to be the ones that work. Potentially there's some shared libraries involved (e.g. detecting which CUDA version(s) are offered by the system), but I really think we either need to have a completely constrained set of variants or allow completely arbitrary logic.

(I hope it's obvious that I prefer the second, but I do think the first is viable enough to put us somewhere functional. The middle-ground of "someone will write the standard plugin and tools will just use them" doesn't really meet any of the maintenance, stability, or security needs of installers-as-in-tools or installers-as-in-people.)

---

## Post #38 by ncoghlan

**Created:** 2025-08-14T19:51:55.049Z  
**Replies:** 1 | **Reads:** 121

[quote="Steve Dower, post:37, topic:102383, username:steve.dower"]
The middle-ground of “someone will write the standard plugin and tools will just use them” doesn’t really meet any of the maintenance, stability, or security needs of installers-as-in-tools or installers-as-in-people.)
[/quote]

Hence the complexity of the WheelNext project :slight_smile:

The folks involved are actively writing the selector plugins needed for some of the thorniest variant selection problems (most notably PyTorch), *and* conducting a large scale demonstration to show they actually solve the problem they're supposed to solve (hence this thread).

I personally wouldn't be shocked if we do end up with a situation where there are a set of "approved" variant selectors that installation tools vendor rather than picking them up dynamically from the environment running the installation tool, but that's a separate question from being able to distribute the design responsibility for the variant selectors themselves to the folks that understand the relevant hardware characteristics and how to query for them.

That's more a post-experiment question than a pre-experiment one, though.

---

## Post #39 by jonathandekhtiar

**Created:** 2025-08-14T19:58:52.571Z  
**Replies:** 1 | **Reads:** 120

@ncoghlan

[quote="ncoghlan, post:38, topic:102383"]
I personally wouldn’t be shocked if we do end up with a situation where there are a set of “approved” variant selectors that installation tools vendor rather than picking them up dynamically from the environment running the installation tool

[/quote]

that’s actually a really good point - if the community decides this is the safest way to “deal with these plugins” - it’s absolutely doable.

Especially combined with attestations ( https://blog.trailofbits.com/2024/11/14/attestations-a-new-generation-of-signatures-on-pypi/ ) & trusted publishers, the security around these plugins can be decided by the community that they must meet a higher level of security to be “default ON” (opt-out)

---

## Post #40 by charliermarsh

**Created:** 2025-08-14T19:59:33.172Z  
**Replies:** 2 | **Reads:** 132

[quote="steve.dower, post:26, topic:102383"]
As I went on to say after the end of the quoted text, this can apply *before* resolution. So basically, as soon as `torch` enters the set of packages that needs to be resolved (and its first set of metadata is accessed), it’s identified as “needs further resolution”, which then determines that for the current platform it should be `torch_xy1234` instead. No interaction with other dependencies is needed - it’s just a straight mapping that is specific to the current machine/configuration. Doesn’t even need any version resolution - if the publisher doesn’t release versions for every variant and the reference included a version (e.g. `torch>2.0`) then it may just *correctly* fail to resolve..

[/quote]

What do you mean by “before resolution”? Do you mean, before we resolve a set of dependencies? (`torch` may not be a first-party dependency. You might depend on a package that depends on `vllm` which depends on `torch` which depends on some `nvidia` libraries, all of which have hardware-enabled variants for different GPUs. How do you ensure that these can resolve together, along with all the other dependencies? Resolution is not a purely sequential process. You may even backtrack to a state such that you no longer need `vllm` at all after trying a few versions.)

What is the “straight mapping that is specific to the current machine/configuration”? Who is determining the values, and detecting them from the machine? Is every package defining its own range of values? And implementing its own logic for inferring them? Is every installer implementing that logic?

If you’re suggesting that *during* resolution, if we identify a package that needs this extra detection, then we run some code to detect the appropriate build for the current machine, and then incorporate that build and its dependencies into the rest of the resolution – then I think that’s just wheel variants? I may well be misunderstanding though.

[quote="steve.dower, post:29, topic:102383"]
I don’t think you can do universal resolution in a lock file. You *could* lock all possibilities and integrate the selection logic (i.e. the arbitrary code) back into the installation logic, or (my preference) the package developer makes them all installable simultaneously (i.e. no conflicting filenames) and chooses at runtime.

[/quote]

The `uv.lock` file in the prototype supports universal resolution with variants. We lock for all variants (like we do for platform markers) and record the necessary providers for the detection. At install time, we run those providers, then resolve the lockfile. It’s similar to markers, except that the value for the marker is provided by (e.g.) an NVIDIA package (or the user, statically). Again, it’s intended as a proof-of-concept to show that it can work.

[quote="steve.dower, post:34, topic:102383"]
Not every single scenario here has to be fully automatic. And especially on the publishing side - manual, predictable and stable usually turns out better in the long run than magical.

[/quote]

Wheel variants do not require that this is fully automatic. That’s really a question of user experience, for *installers*. For example, an installer should allow users to specify variants statically.

---

## Post #41 by steve.dower

**Created:** 2025-08-14T20:06:05.671Z  
**Replies:** 1 | **Reads:** 126

[quote="Charlie Marsh, post:40, topic:102383, username:charliermarsh"]
If you’re suggesting that *during* resolution, if we identify a package that needs this extra detection, then we run some code to detect the appropriate build for the current machine, and then incorporate that build and its dependencies into the rest of the resolution – then I think that’s just wheel variants?
[/quote]

Yes, that's what I'm suggesting. But the difference is that I'm suggesting to change the _name_ of the package, and not adding additional opaque fields or metadata.

The main thing I care about is not having to change the filename format, and being able to fully and precisely express a resolved environment (not a universal lock, a specific lock) without having to update every tool that already exists.

[quote="Charlie Marsh, post:40, topic:102383, username:charliermarsh"]
At install time, we run those providers, then resolve the lockfile. It’s similar to markers, except that the value for the marker is provided by (e.g.) an NVIDIA package (or the user, statically). Again, it’s intended as a proof-of-concept to show that it can work.
[/quote]

Yeah, this is basically what I meant by "integrate the selection logic". We can _lock_ everything, but still need to re-run the selection logic every time the lockfile is installed in order to select the actual package that's going to be used. That'll upset the "never arbitrary code" people, but they don't have to use universal locks :man_shrugging: 

[quote="Charlie Marsh, post:40, topic:102383, username:charliermarsh"]
Wheel variants do not require that this is fully automatic.
[/quote]

I think this is misinterpreting what I was intending by my statement - I was suggesting we should force some people to do more stuff manually, specifically, the package developers. Making them specify "when these conditions are present on the system, choose my package `xyz`" is making them do manual work, which some suggestions seem to imply are unnecessary (standard suffixes being used without the package developer's "approval", or opt-in vs. opt-out at install time).

It's not about requiring fully automatic, it's that we don't need to pretend to be fully automatic and should quite happily make (some) people do manual labour. There just aren't that many packages that need this functionality that we need to worry about burden - they're all under burden already, so we're just redirecting it into (hopefully) more sustainable effort than what they're currently having to do.

---

## Post #42 by pf_moore

**Created:** 2025-08-14T20:26:42.367Z  
**Replies:** 2 | **Reads:** 127

[quote="Zanie Blue, post:18, topic:102383, username:zanie"]
Do you agree with that?
[/quote]

I think that it's too subtle of a nuance for the average user to understand. Most people think (entirely reasonably, given the current promises we make) that if they prevent sdists, they are safe from arbitrary code execution. Whether they "block sdists" by using `--only-binary :all:`, or by having a local package index that only hosts wheels, or by some other means altogether, is irrelevant here (and that's precisely why I don't think the comments about `--only-binary :all:` are relevant - it's only one way of limiting installs to wheels). What matters is "if I only have wheels, I have achieved a baseline level of security".

[quote="Jonathan Dekhtiar, post:39, topic:102383, username:jonathandekhtiar"]
that’s actually a really good point - if the community decides this is the safest way to “deal with these plugins” - it’s absolutely doable.
[/quote]

My biggest concern here is the dynamic selection of plugins. IMO, the "never runs arbitrary code" install path is a critical requirement for many people, and for those people, having the installation of plugins triggered by package metadata will be unacceptable.

Why couldn't we simply require the user to *manually* install the needed plugins, before doing an install? There might need to be some means of pre-scanning an install request to determine which plugins are needed, or maybe have a set of "well known" plugins that people would expecty to install for common use. And if an install needs a plugin that isn't available, it fails asking the user to install that plugin. This isn't like PEP 517 build backends - sdist building already allowed arbitrary code to run, so installing and running a build backend based on metadata was no less secure than the status quo. But selecting and installing wheels has always been a purely static operation until now, so adding automatic installation and running of plugin code is a fundamental change to the security characteristics of that operation.

I don't want to (nor do I have the time to) review all of the discussions that took place offline, on the wheel-next discussion group, but I find it hard to have confidence in the design that has come out of that group when a security question as basic as "how do I ensure that I can install this package without running any code downloaded off the internet" doesn't seem to have been considered.

I apologise if the above sounds harsh. I still haven't had the time to read the pre-PEP - there's a lot of concepts and terminology I need to get up to speed with before it makes any sense to me[^1]. But *surely* locked down environments aren't so esoteric that these questions weren't considered?

Maybe what's needed here is a "toy" example, one that's unrealistic but doesn't require understanding the complexities of GPU variants, SIMD instruction sets, or anything like that. Maybe just a plugin that checks "does the user have gcc on their path?" (`shutil.which("gcc") is not None`). What would various user interactions look like for something like that?

[^1]: One reason I prefer designs being thrashed out on Discourse is that it allows participants to get familiar with concepts and terminology gradually, as the discussion progresses. By doing the design offline, and coming in with an established proposal, all of that learning curve needs to be navigated at once by new participants.

---

## Post #43 by pf_moore

**Created:** 2025-08-14T20:52:57.593Z  
**Replies:** 1 | **Reads:** 123

Apologies - messages are arriving as I'm typing, and it's hard to keep up. I'm going to take a pause and try to let things settle down so I can respond in a batch, but I wanted to address this point.

[quote="Charlie Marsh, post:40, topic:102383, username:charliermarsh"]
What do you mean by “before resolution”?
[/quote]

It's *really* important to remember that the idea of "resolution" isn't part of any standard. Nor, for that matter, is anything to do with "how to install a set of packages". In fact, the only things that are defined by standards are:

1. How to install a wheel.
2. How to build a wheel from a sdist.
3. How to check if a single wheel is valid in a given environment^[And even this is only defined to the point of saying that the installer has to know what sets of tags it considers compatible with the environment.].

Everything else that installers, lockers, and other tools do, are based on these three standards (and given that building a wheel from a sdist is by far the hardest of these, I imagine that many tools only use (1) and (3), and don't support sdists - we mustn't make the mistake of assuming that uv and pip are the only installers - there's the `installer` project, as well as who knows how many custom, special-purpose tools).

This proposal appears to be extending (3). That's all (as far as I can tell - if I'm wrong, please say so!). But we *are* expecting every tool that relies on (3) to be modified as a result of this proposal.

@steve.dower seems to be arguing for an alternative approach that standardises something else - basically, other parts of the resolution process. I'm not sure how viable that is, or whether it would prove to be less problematic than the wheel variant approach of just^[That word is doing a *lot* of work in this sentence :slightly_smiling_face:] modifying the "is this wheel valid" logic. And I don't know how it would fit with specialised tools.

---

## Post #44 by zanie

**Created:** 2025-08-14T20:57:05.671Z  
**Replies:** 1 | **Reads:** 119

[quote="Paul Moore, post:42, topic:102383, username:pf_moore"]
[...] I find it hard to have confidence in the design that has come out of that group when a security question as basic as “how do I ensure that I can install this package without running any code downloaded off the internet” doesn’t seem to have been considered.
[/quote]

Frankly, this is comment is unnecessary. Please don't include personal attacks — you can just say the design does not sufficiently address this question.

While you may disagree with the conclusions, the design _does_ consider this question in the [Security Implications](https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#security-implications) section. There are several possible routes to ensure installing a package will not download third-party code listed there. Hopefully through discussion here, we can determine which of those is appropriate, or come up with other ways to harden the design if they are not.

---

## Post #45 by pf_moore

**Created:** 2025-08-14T21:10:35.465Z  
**Replies:** 2 | **Reads:** 120

[quote="Zanie Blue, post:44, topic:102383, username:zanie"]
Frankly, this is comment is unnecessary.
[/quote]

I apologise. While my comment wasn't intended as a personal attack, I did word it badly. I let my frustration over the fact that a huge amount of work has happened "offline", and we're now having to catch up on all of that get reflected in my wording.

[quote="Zanie Blue, post:44, topic:102383, username:zanie"]
While you may disagree with the conclusions, the design *does* consider this question in the [Security Implications](https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#security-implications) section.
[/quote]

Thanks for the link. I did take a look to see if I could find an obvious place where this was discussed, but I missed this. I'll read it now - as you say, I may well disagree with the conclusions, but I was clearly wrong to say that it hadn't been considered and I apologise once again.

Edit: OK, having read that section, the points in there are reasonable. As you expected, I disagree that "flexibility and user convenience" are more important than security here, and I'd want the approach to be switched around, with the secure options being the required approach, leaving dynamic plugins as a possible extension that the proposal requires to be explicitly requested by the user.

---

## Post #46 by zanie

**Created:** 2025-08-14T21:27:12.270Z  
**Replies:** 0 | **Reads:** 117

Thanks Paul, I appreciate that a lot (and am sure other people working on the project will too).

[quote="Paul Moore, post:45, topic:102383, username:pf_moore"]
[...] the fact that a huge amount of work has happened “offline”
[/quote]

For what it's worth, the intent was not to hide work from anyone. The goal was to reach a prototype, which, for a problem this complex, required significant iteration and collaboration from multiple stakeholders. As [Charlie said](https://discuss.python.org/t/wheelnext-wheel-variants-an-update-and-a-request-for-feedback/102383/21), I'd expect any proposal to go through significant iteration and I hope it's clear that consensus here remains essential.

---

## Post #47 by jonathandekhtiar

**Created:** 2025-08-14T21:28:57.689Z  
**Replies:** 1 | **Reads:** 120

[quote="pf_moore, post:45, topic:102383"]
I let my frustration over the fact that a huge amount of work has happened “offline”, and we’re now having to catch up on all of that get reflected in my wording.

[/quote]

I would like to address the “why” behind this - I think it’s important. You may not agree with our decision to create “WheelNext” but I hope to provide perspectives.

WheelNext was created to engineer a “collaborative space” modeled after the “Faster CPython community” that is able to focus on some packaging challenges that the Scientific Python community feels the weight of everyday.

Now - could we have done this differently ? For sure.

We believe our approach was necessary to design properly and refine a proposal as complex as the “Wheel Variant proposal” touching so many aspects of the packaging ecosystem. And maybe most importantly: to convince ourselves first “It works and correctly address the problem for some one of the most difficult use-cases the community is facing”.

We kept everything in the open - not one commit not one discussion is happening behind closed gates. We had many talks: PyCon 25 (talk & packaging summit),  WheelNext Sumit, etc. and every time we presented our work it triggered a fairly extensive rework / redesign of our proposals. And it’s awesome ! And I have no doubt publishing the PEP will be a long process of refinements and adjustments and very possibly changing some fundamental assumptions.

This ability to quickly pivot and focus on something that works - we see it as an essential step to “coming with a good first draft of the PEP” and I hope we will soon convince most of you we have put the significant effort into writing a great starting point to this discussion while proving that the “Wheel Variant concept” does work and can work effectively and we will able to focus the conversation on how to make it best work with the ecosystem assumptions (like no remote code execution).

WheelNext is only the vehicle that allows us to create a focused community of dedicated people focused on refining and proving these ideas to themselves first. The ultimate goal is to publish a PEP. We do not anticipate you having to go to WheelNext channels and unearth months old discussions (that might already be outdated). This is our job to communicate to DPO community the summary of these conversations and make them digestible to everybody. And if there is anything we can do to make it easier for you and others to “catch up” - please let us know and I’m sure we all do what we can to make it happen.

For now - we are focused on regrouping all our “bits of docs” and “conversations” into a PEP that is shorter than a 7 volume space odyssey saga  :smiley: .

Now - if anyone is very eager to have access to the PEP draft I’ll be pleased to forward it - though please understand this is a WIP and absolutely not ready to be publicly released.

I hope this provides some much needed context.

---

## Post #48 by barry

**Created:** 2025-08-14T21:36:10.204Z  
**Replies:** 2 | **Reads:** 125

[quote="Steve Dower, post:41, topic:102383, username:steve.dower"]
But the difference is that I’m suggesting to change the *name* of the package
[/quote]

Given that the package name namespace is [almost](https://peps.python.org/pep-0752/) entirely unconstrained, how do you prevent "variant squatting" in that scenario?   I share @zanie's concern about that, and I'm not sure how

[quote="Steve Dower, post:29, topic:102383, username:steve.dower"]
In my model, whoever owns `foo` chooses the names that it may resolve to.
[/quote]

helps prevent that, unless you're thinking about something along the lines of PEP 752 style namespaces.  One of the major benefits IMHO of the variant proposal is that you're not changing anything about how package naming or package ownership works.

[quote="Paul Moore, post:42, topic:102383, username:pf_moore"]
Most people think (entirely reasonably, given the current promises we make) that if they prevent sdists, they are safe from arbitrary code execution.
[/quote]

That *might* be true^[I can't speak to what most people think here], but I think one of the main reasons to use `--only-binary :all:` is to prevent the highly likely failures during the package build process.  Extension module builds are increasingly complex, and we have no standard interface for them, so it's more likely than not that trying to build an sdist with an extension module is just going to fail.  Better to fail fast and uncryptically in those cases.

[quote="Paul Moore, post:42, topic:102383, username:pf_moore"]
My biggest concern here is the dynamic selection of plugins.
[/quote]

Surely that's something installer tools could solve, right?  Options include hardcoding the exact set of provider plugins they'll allow, vendoring, command line options to control behavior, etc.

[quote="Paul Moore, post:42, topic:102383, username:pf_moore"]
Why couldn’t we simply require the user to *manually* install the needed plugins, before doing an install?
[/quote]

Your installer tool of choice could require that.

[quote="Paul Moore, post:43, topic:102383, username:pf_moore"]
How to build a wheel from a sdist.
[/quote]

I'll note the [wheel-stub](https://pypi.org/project/wheel-stub/) package which piggybacks on the sdist build backends to effectively do variant resolution at sdist "build" time, and utilizes external indexes to resolve to the appropriate variant wheel.  While a very clever hack given the realities of today's packaging standards, it's ultimately suboptimal because it's inscrutable, with no ability to statically analyze or reason about what's going on.  And of course, because it uses the build backends it executes arbitrary code.

---

## Post #49 by mikeshardmind

**Created:** 2025-08-14T21:55:56.418Z  
**Replies:** 5 | **Reads:** 120

[quote="Alyssa Coghlan, post:36, topic:102383, username:ncoghlan"]
Edit to clarify: and since we don’t want to hard code a specific supported set of variant dimensions, the selector plugins get identified via PyPI project names.
[/quote]

There's more than one problem with this approach. The most obvious one is that if any package could be a selector without the user knowing, then they can't even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the "Actual" package.

I don't think the problem space affects enough packages to warrant this. All of the existing "big packages" with this problem would have enough info statically if we had just this information in the distribution info, available to resolvers:

- preferred order of variants
- required cpu instructions per variant
- gpu requirement per variant
- required version of bundled libraries (mapping of name to version)

---

## Post #50 by aterrel

**Created:** 2025-08-14T21:58:27.596Z  
**Replies:** 1 | **Reads:** 122

[quote="steve.dower, post:10, topic:102383"]
Seriously, why not just give the packages different names? Does it really hurt that much to `pip install torch_cu128` if you want the build for that variant? And it works today, even with all the concerns being raised in this thread.

[/quote]

Well we’ve been doing that with CUDA for a while and we have these `cu11` and `cu12` tags all over the place. The problem is that names turn into extra agruments for every downstream dependency.

For example, there are two dozen `cupy` named projects on pypi. Now if I’m a simple library that selects between algorithms like `nvmath-python` I could just have one dependency with variants, but instead they have a [dozen different extra selectors](https://docs.nvidia.com/cuda/nvmath-python/latest/installation.html). Thus anything that wants to have `nvmath-python` as a dependency now has carry which of the 24 X 12 different combinations it needs to supported just to call a faster matrix multiply. 

So yes I think it hurts user experience quite a bit to just rely on names.

---

## Post #51 by steve.dower

**Created:** 2025-08-14T22:00:17.935Z  
**Replies:** 1 | **Reads:** 122

[quote="Barry Warsaw, post:48, topic:102383, username:barry"]
I’m not sure how

[quote="steve.dower, post:29, topic:102383"]
In my model, whoever owns `foo` chooses the names that it may resolve to.
[/quote]

helps prevent that
[/quote]

Because `foo` literally contains the names to be used instead:

```
# foo.py - or some clever metadata that I'd rather not invent but I'm sure people would prefer to have a Turing complete TOML file rather than Python code
if detect_cuda_12_8():
    return "foo-cu128"
else:
    return "foo-cpu"
```

The only way a package could resolve to a squatted name is by putting squattable logic into the main package (e.g. `return f"foo-{os.environ['PROCESSOR']}"`). But I'd say that's a bad idea and you shouldn't do it ;)

(I guess I should also point out the similarity to the idea of hosting wheels off of PyPI and using an sdist to "build" the wheel by downloading the right one. That was safe enough because the URLs were hard-coded into the build script. If I were going to mock up a demo of this, it's more or less exactly how I'd do it - a build backend that determines its dependencies dynamically and produces a "wheel" that depends on the specific name you want.)

---

## Post #52 by steve.dower

**Created:** 2025-08-14T22:02:26.130Z  
**Replies:** 0 | **Reads:** 120

[quote="Andy Terrel, post:50, topic:102383, username:aterrel"]
Now if I’m a simple library that selects between algorithms like `nvmath-python` I could just have one dependency with variants, but instead they have a [dozen different extra selectors](https://docs.nvidia.com/cuda/nvmath-python/latest/installation.html).
[/quote]

In my proposal they'd just rely on the selector, and the variant is chosen on install. If the library has a _specific_ requirement, they can depend on the variant directly (because it's just a package name). If it has to dynamically choose which variant it should depend on, then it needs its own variant selector (but this seems like the least common case, whereas depending on `cupy` and letting the selector logic sort it out seems most common).

I believe this is exactly the same as the variant proposal given here, apart from not trivially being able to add a dependency to a specific variant (independent of platform - depending on `cupy_cu11` is going to work on Windows, macOS, manylinux just fine, while always getting the CUDA 11 variant).

---

## Post #53 by pf_moore

**Created:** 2025-08-14T23:10:40.535Z  
**Replies:** 1 | **Reads:** 120

[quote="Jonathan Dekhtiar, post:47, topic:102383, username:jonathandekhtiar"]
I hope this provides some much needed context.
[/quote]

It does, and I'm not saying that the decision to work the way you did wasn't justified. But it does have its costs, and one of those is that for people like me who don't have the time to follow another discussion forum alongside Discourse, there's a lot of hidden context that we have to discover after the fact.

[quote="Barry Warsaw, post:48, topic:102383, username:barry"]
Surely that’s something installer tools could solve, right?
[/quote]

I guess so? But that results in an inconsistent user experience (if pip disallows all plugins, users will get different results when using pip rather than uv). Plus, what does a library like `installer` do? It doesn't have the luxury of picking one solution, as its users are tools that quite possibly want to make their own UX choices.

[quote="Barry Warsaw, post:48, topic:102383, username:barry"]
Your installer tool of choice could require that.
[/quote]

So if pip chose that route, what would happen with the proposal? We'd be saying "pip supports wheel variants" and I wouldn't expect to be faced with people claiming that what we had wasn't "proper support". There's a bit of a dilemma here - while I'm the first to point out that we can't assume that there's just pip and uv, it's still true that in reality, what pip and uv do *is* what users see as the implementation of new standards. In practice, people don't have an "installer tool of choice", so leaving decisions about key functionality to tools ends up transferring decisions from the standards process to a small group of installer maintainers. I'd rather where possible have the standards make the decisions.

[quote="Barry Warsaw, post:48, topic:102383, username:barry"]
I’ll note the [wheel-stub](https://pypi.org/project/wheel-stub/) package which piggybacks on the sdist build backends to effectively do variant resolution at sdist “build” time, and utilizes external indexes to resolve to the appropriate variant wheel. While a very clever hack given the realities of today’s packaging standards, it’s ultimately suboptimal because it’s inscrutable, with no ability to statically analyze or reason about what’s going on. And of course, because it uses the build backends it executes arbitrary code.
[/quote]

I was almost going to propose that approach as an alternative solution. I was aware of wheel-stub, and I knew it wasn't well-liked as a solution, but I don't think the objections you raise *necessarily* stand up to scrutiny. Particularly if it's being considered as an alternative to the existing wheel variant proposal which also has people objecting to it :wink:

For example, you could enable static analysis and remove the inscrutability problem by defining a new static metadata file, which will always appear in the sdist alongside `pyproject.toml` (you could even use `pyproject.toml` itself, if you wanted). The build backend doesn't have *any* "inscrutable" logic, it simply implements the selection criteria defined by the metadata.

And of course, "because it uses the build backends it executes arbitrary code" is hardly an objection to this approach when it's being offered as an alternative to wheel variants, which execute arbitrary code. The advantage of a build backend is that sdist are already well known to allow arbitrary code execution, so this matches people's expectations much better than wheel variants.

This isn't a completely serious suggestion - I'm sure that if it were viable, wheel-stub would have had more success. But it's certainly a credible counter argument to the idea that we *have* to allow arbitrary plugin execution during the wheel selection process.

Also, if you want a middle ground, how about taking that metadata file I mentioned, and packaging it as a new type of distribution artefact, call it a "selector" for now, which can be published like a wheel but it's clearly documented as needing to download and run plugins when being used. That avoids the negative connotations of a sdist, while keeping wheels secure. This may be similar to Steve's selector idea, I'm not entirely sure?

---

## Post #54 by barry

**Created:** 2025-08-14T23:13:21.793Z  
**Replies:** 1 | **Reads:** 116

[quote="Steve Dower, post:51, topic:102383, username:steve.dower"]
Because `foo` literally contains the names to be used instead
[/quote]

That looks like code that has to get executed to me :wink:.  Where, when, and by which component would that conditional get executed?

[quote="Steve Dower, post:51, topic:102383, username:steve.dower"]
I guess I should also point out the similarity to the idea of hosting wheels off of PyPI and using an sdist to “build” the wheel by downloading the right one. That was safe enough because the URLs were hard-coded into the build script. If I were going to mock up a demo of this, it’s more or less exactly how I’d do it - a build backend that determines its dependencies dynamically and produces a “wheel” that depends on the specific name you want.
[/quote]

Time machine to the rescue!  That's basically how [wheel-stub](https://pypi.org/project/wheel-stub/) works^[mentioned above, but possibly buried in a longer response].

---

## Post #55 by barry

**Created:** 2025-08-14T23:20:40.396Z  
**Replies:** 0 | **Reads:** 115

[quote="Paul Moore, post:53, topic:102383, username:pf_moore"]
I’d rather where possible have the standards make the decisions.
[/quote]

IIRC, we've been down that road in other discussions^[default extras?], with the line between what should be standardized and what should be left to the tool being murky at best.  Maybe we can't boldify that line any better than it is now, but it might help to express the principles and thought processes that go into which side of that line a particular behavior belongs.  Kind of like a Zen of Packaging? :smiley: 

[quote="Paul Moore, post:53, topic:102383, username:pf_moore"]
But it’s certainly a credible counter argument to the idea that we *have* to allow arbitrary plugin execution during the wheel selection process.
[/quote]

Perhaps, but I think *when* the arbitrary code is executed is important here, and given that there are ideas about how to make the variant selection process much more (entirely?) static it might be possible under variants to eliminate code execution for paranoid use cases^[which I agree are completely valid to worry about].

---

## Post #56 by oscarbenjamin

**Created:** 2025-08-15T00:11:20.817Z  
**Replies:** 3 | **Reads:** 122

[quote="Michael H, post:49, topic:102383, username:mikeshardmind"]
There’s more than one problem with this approach. The most obvious one is that if any package could be a selector without the user knowing, then they can’t even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the “Actual” package.
[/quote]

Would you consider this to be a problem in the opt-in case?

If you have something like
```
$ pip download foo
downloading foo...
package foo needs selector bar
Run selector bar [y/n]?
```
then is that acceptable?

[quote="Michael H, post:49, topic:102383, username:mikeshardmind"]
I don’t think the problem space affects enough packages to warrant this. All of the existing “big packages” with this problem would have enough info statically if we had just this information in the distribution info, available to resolvers:

* preferred order of variants
* required cpu instructions per variant
* gpu requirement per variant
* required version of bundled libraries (mapping of name to version)
[/quote]

This reminds me of how manylinux played out. There was manylinux 1 in [PEP 513](https://peps.python.org/pep-0513/), then [PEP 571](https://peps.python.org/pep-0571/) for manylinux 2010, then [PEP 599](https://peps.python.org/pep-0599/) for manylinux 2014 and then finally [PEP 600](https://peps.python.org/pep-0600/) for "perennial manylinux". It seemed that it was possible to enumerate the possibilities but then the PEP process became too much and we needed a PEP that specified a mechanism that could be extended without a PEP.

I agree that the possibilities you enumerated cover the main cases right now but I think it is bad to get into a situation where those special cases have to be hard-coded into a specification or into individual tools without a specification. This is a dynamic problem space but we also need coordination across tools. I think it is better to have an extensible but specified mechanism as is proposed here.

The tension here is between secure-by-default and maximising convenience in the common case especially for novice users. These conflicting aims are qualitatively different though:

- Secure-by-default is binary and absolute
- Convenience is a sliding scale

The proposal as specified right now maximises convenience and then concludes that secure-by-default is not possible but I think it is better to start the other way round:

- Assume secure-by-default from the outset
- Consider how to maximise convenience without compromising  security.

I can imagine that the convenience starts with an opt-in prompt:
```
Run selector bar [y/n]?
```
There can also be flags like `--unsafe-run-selectors`. Later on there can be blessed selectors that are vendored into the installers and at this point it is appropriate to consider the particular issues for the "big packages" to maximise convenience for common user situations while still maintaining secure-by-default.

There are various comments above about the fact that existing installers will run arbitrary code because they install from sdists. With my long memory I can say that it is (or at least was) a longstanding goal since way back to when wheels were invented to abolish this. Over time we get closer to `--only-binary` by default being a possibility as more packages have wheels. The proposal here as it stands suggests a backwards move on this front where arbitrary code execution would be promoted as the new way of doing things for some of the most popular packages rather than being a legacy mode for older packages that is retained for backward compatibility.

Some of the packages that provide sdist but not wheel do so because they have simply not been update to provide wheels. Others have legitimate reasons for using sdist because the wheel format does not provide what they need due to lack of arbitrary code execution. It is possible that the proposal here actually solves some of those cases by providing sufficient capability in wheel installation that they can do what is needed. That might bring us closer to the possibility of `--only-binary` being a plausible default. I think it would be better to consider if this proposal makes it possible to move to secure-by-default rather than using the non-secure status quo to justify introducing the proposal here in an insecure way as well.

Lastly the proposal here discusses using the variant mechanism for CPU capabilities. The proposal seems perhaps inspired by a previous [thread](https://discuss.python.org/t/selecting-variant-wheels-according-to-a-semi-static-specification/53446) in which I suggested exactly this. I just want to be clear here that I think that micro-architecture variants like `x86_64-v2` etc should really be handled as part of the CPU tag rather than through the variant mechanism that is proposed here. As a temporary or unusual mechanism variants can make sense for CPU capabilities but this should not replace efforts to improve the way that CPU architecture is represented in the main static metadata.

---

## Post #57 by dstufft

**Created:** 2025-08-15T01:50:22.114Z  
**Replies:** 1 | **Reads:** 113

*Note: I’m now employed by NVIDIA, but these are my own thoughts, which I’m still trying to decide how to I feel about specifics parts of this design.*

Perhaps a useful thought experiment. 

If the variant plugins were opt-in and users ran into a package that used variants. Would we expect them to typically just allow it?

I’m thinking back to PEP 438, and how people really really hated the requirement to allow certain packages to install, and the feedback was almost universally negative, and in most cases people just blindly did whatever it took to make the thing work.

One thing I’d worry about for an opt-in thing, is what the chances are that the flags to opt in just become some random cruft that users end up having to just cargo cult into their environments to make things work as they would expect.

---

## Post #58 by ncoghlan

**Created:** 2025-08-15T03:05:02.341Z  
**Replies:** 0 | **Reads:** 118

Full disclosure: @dstufft's disclosure reminded me that I should also mention that I have a paid interest in this topic via LM Studio. Handling parallel CUDA stacks more gracefully in `venvstacks` is a [not yet solved problem](https://github.com/lmstudio-ai/venvstacks/issues/179). It's not impossible to do with things as they are, just awkward and inconvenient due to the need to keep assorted direct URL references both up to date and internally consistent.

A further bit of related background that's likely to be useful for folks that haven't previously encountered it is the documentation for `uv`'s existing variant selection logic for PyTorch: https://docs.astral.sh/uv/guides/integration/pytorch/#configuring-accelerators-with-optional-dependencies

The situation in the status quo that the wheel variant proposal is aiming to get away from is the one where a naive `pip install project` installs a dependency stack for `project` that *technically* "works" (in that it runs without crashing), but is in fact so slow that the claim of "working" is debatable. We also don't want to get into a situation where package installer authors have to be experts in hardware acceleration technologies, nor have every project that publishes hardware accelerated extension modules require such expertise.

Getting to a point where there are a handful of common selector modules, preferably available as both pure Python modules (for potential vendoring in `pip` and other Python based installers) and as Rust crates (for potential static linking in `uv`), isn't going to be easy, it just seems a more tractable problem than *directly* baking that selection logic into package installers, or distributing variations of the logic across every project with a hardware accelerated extension module.

[quote="Michael H, post:49, topic:102383, username:mikeshardmind"]
they can’t even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the “Actual” package.
[/quote]

When downloading for introspection, there's no need to only analyse the optimal wheel for the current hardware - you would probably want to bypass the selector logic entirely and analyse *all* the wheels available for the platforms you care about. (That may actually be a reasonable default behaviour for the `pip download` use case)

---

## Post #59 by pf_moore

**Created:** 2025-08-15T08:14:44.568Z  
**Replies:** 1 | **Reads:** 116

[quote="Jonathan Dekhtiar, post:1, topic:102383, username:jonathandekhtiar"]
We have carefully designed this system to ensure that installers unaware of variants will safely ignore them, maintaining backward compatibility with the existing ecosystem.
[/quote]

Taking a step back from the plugin debate for a moment, this proposal seems to imply a new wheel version (the file name format changes, for example, which is incompatible with the current spec). How have you addressed the well known issues with transition to a new wheel version?

---

## Post #60 by steve.dower

**Created:** 2025-08-15T08:38:22.339Z  
**Replies:** 1 | **Reads:** 119

[quote="Donald Stufft, post:57, topic:102383, username:dstufft"]
If the variant plugins were opt-in and users ran into a package that used variants. Would we expect them to typically just allow it?
[/quote]

Yeah, I'm pretty sure they would just run it. What do you get otherwise? A non-working package?

[quote="Barry Warsaw, post:54, topic:102383, username:barry"]
That looks like code that has to get executed to me :wink:. Where, when, and by which component would that conditional get executed?
[/quote]

I know you're pushing towards "malicious code bad", but the reality is that people who care about malicious code care about _the entire package_, and so it's all treated as risky. Whether it runs at install time or at first use (and so much malware on PyPI runs on first use, not on install) isn't that big a difference.

So my answer is "just like a build backend", and the reason it's better than `setup.py` is we can start with cleaner designs (we aren't cargo-culting 20 years of dealing with compilers/etc.), and it's a special case that will _immediately_ attract attention. Metadata would have to indicate a selector package, so that it can be executed immediately instead of waiting for a complete resolution, which means scanners will immediately look at their contents and detect things that aren't sensible for that scenario (e.g. network access - a big difference from wheel-stub is that a selector package shouldn't _need_ network access, so _any_ example of it is a red flag, while wheel-stub requires at least some, making it harder to flag the bad examples).

The combination of scanning Python code for sandbox detection and then running it in a sandbox/detonation chamber to detect malware is perfect for the scale and scope of selector packages.

I can only assume that most people aren't aware of the multiple teams who scan _everything_ that gets uploaded to PyPI, usually reporting new malicious packages within hours of it appearing. I see no reason to assume that this wouldn't continue to happen for selector packages, and it gets easier if we're encouraging the logic to be simple, tightly-scoped, networkless, and uploaded to PyPI. (This is another example of my "it doesn't have to be automatic" position - we don't have to prevent malware by specification, we can instead trust people and then verify.)

---

## Post #61 by aragilar

**Created:** 2025-08-15T08:45:21.994Z  
**Replies:** 0 | **Reads:** 118

How does this interact with existing installations? https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#variant-information_1 makes it sound like `variant.json` is part of the install, is the variant used tracked, and what happens when the system changes and such a variant is no longer a valid choice?

---

## Post #62 by pitrou

**Created:** 2025-08-15T09:55:01.164Z  
**Replies:** 2 | **Reads:** 116

[quote="Alyssa Coghlan, post:30, topic:102383, username:ncoghlan"]
So NumPy & SciPy need to match on the BLAS library they’re built against.
[/quote]

Do they? The BLAS library is a private implementation detail of either library. If BLAS symbols are hidden ^[And perhaps even if they are not, given CPython's use of `RTLD_LOCAL`], things should ideally work fine.

[quote="Alyssa Coghlan, post:30, topic:102383, username:ncoghlan"]
CPU instruction sets don’t necessarily impose cross project compatibility issues, but can make a big difference in runtime performance.
[/quote]

The most idiomatic and user-friendly solution for this is to adopt dynamic dispatch rather than ship different packages for different CPU support levels.

[quote="Alyssa Coghlan, post:30, topic:102383, username:ncoghlan"]
For CUDA at least (I’m not sure about ROCm) everything needs to be built against the *same* CUDA version.
[/quote]

I gladly admit my incompetence on this, but do you have a pointer to this? This official doc seems to say otherwise:
https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/#binary-compatibility

Also note that there are two CUDA APIs (and libraries): the CUDA runtime API and the CUDA driver API. According to the link above:
> The CUDA Driver API has a versioned C-style ABI, which guarantees that applications that were running against an older driver (for example CUDA 3.2) will still run and function correctly against a modern driver (for example one shipped with CUDA 11.0)

---

## Post #63 by charliermarsh

**Created:** 2025-08-15T10:41:58.150Z  
**Replies:** 1 | **Reads:** 114

[quote="mikeshardmind, post:49, topic:102383"]
I don’t think the problem space affects enough packages to warrant this.

[/quote]

Not to pick on this specific comment, but I want to mention that one of the goals of the WheelNext effort was to pull together a bunch of different stakeholders that care about this problem – to demonstrate that it wasn’t just one organization or entity advocating for these changes. There are a lot of different companies, individuals, and (by extension) packages involved. We don’t even publish any such packages, but a non-trivial portion of the issues that we get in uv stem from the problems that variants are trying to solve. Even if we just limit it to the GPU use-case, these packages are *hugely* popular (and I believe, though obviously can’t prove, that there would be more of them if it wasn’t *so* hard to package and distribute, e.g., `vllm` for a variety of different GPU architectures, declare dependencies based on the GPU architecture, enable users to install the “right” build without a deep understanding of Python packaging, etc.).

[quote="mikeshardmind, post:49, topic:102383"]
The most obvious one is that if any package could be a selector without the user knowing, then they can’t even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the “Actual” package.

[/quote]

I don’t fully follow this point. Why do you need to run code to look at the provider package? The providers tend to be pure Python; they are not themselves variant-enabled, at least for the proof of concepts that were used in the PyTorch experiment. I don’t know why they would be.

---

## Post #64 by mgorny

**Created:** 2025-08-15T12:19:33.370Z  
**Replies:** 0 | **Reads:** 109

…and I don’t think `pip` defaults can change anytime soon, because high profile packages still have some old dependencies that don’t provide wheels. I’m sorry I don’t have a specific example handy, but I do recall seeing `pip` build an sdist recently when I was installing dependencies for some test suite.

---

## Post #65 by mikeshardmind

**Created:** 2025-08-15T12:30:32.124Z  
**Replies:** 0 | **Reads:** 112

[quote="Charlie Marsh, post:63, topic:102383, username:charliermarsh"]
[quote="mikeshardmind, post:49, topic:102383"]
The most obvious one is that if any package could be a selector without the user knowing, then they can’t even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the “Actual” package.
[/quote]

I don’t fully follow this point. Why do you need to run code to look at the provider package? The providers tend to be pure Python; they are not themselves variant-enabled, at least for the proof of concepts that were used in the PyTorch experiment. I don’t know why they would be.
[/quote]

I could have worded this better. At the end of the day, this issue here is that this causes many places that not only have people expected, but that expecting it was part of the push for wheels, that downloaded remote code would not be executed.

[quote="Charlie Marsh, post:63, topic:102383, username:charliermarsh"]
[quote="mikeshardmind, post:49, topic:102383"]
I don’t think the problem space affects enough packages to warrant this.
[/quote]

Not to pick on this specific comment, but I want to mention that one of the goals of the WheelNext effort was to pull together a bunch of different stakeholders that care about this problem – to demonstrate that it wasn’t just one organization or entity advocating for these changes.
[/quote]

The rest of that comment goes over how it seems given the stakeholders at issue, this could have been done statically, and I don't see any compelling argument here as to why it couldn't. Doing this at the resolver level rather than allowing packages to execute code to decide what to install also allows the resolver to bail out earlier if there are conflicting requirements like incompatible BLAS linking, because that information is just there upfront.

---

## Post #66 by mikeshardmind

**Created:** 2025-08-15T12:33:01.194Z  
**Replies:** 0 | **Reads:** 110

[quote="Oscar Benjamin, post:56, topic:102383, username:oscarbenjamin"]
[quote="mikeshardmind, post:49, topic:102383"]
There’s more than one problem with this approach. The most obvious one is that if any package could be a selector without the user knowing, then they can’t even download the wheel to inspect it before trusting and running it with the existing tools, as downloading would imply running the selector to get the “Actual” package.
[/quote]

Would you consider this to be a problem in the opt-in case?

If you have something like

```
$ pip download foo
downloading foo...
package foo needs selector bar
Run selector bar [y/n]?
```

then is that acceptable?
[/quote]

I think it's "possibly okay" but still a suboptimal compromise on the promises of wheels to do this if it's opt in, but I worry a little bit that repeated prompts like this will lead to people ignoring them.

---

## Post #67 by mgorny

**Created:** 2025-08-15T13:01:39.742Z  
**Replies:** 0 | **Reads:** 111

[quote="pf_moore, post:16, topic:102383"]
I’m somewhat concerned that so far this proposal has not been discussed at all on Discourse. While the concern may have been “well discussed in other forums” I don’t want the discussion here to be based on an edited or summarised version of discussions that have happened elsewhere. Packaging standards are based on a consensus-driven process, and when significant parts of a proposal’s design happens outside of this forum, that consensus based process is at risk. If nothing else, there’s going to be an understandable reluctance to entertain significant changes to the proposal because of the amount of effort already invested in what you have.

[/quote]

I’m sorry but this is simply not true. This has been discussed a lot before. I believe that https://discuss.python.org/t/implementation-variants-rehashing-and-refocusing/54884 provides the most recent summary.

Sure, we could have rebooted the discussion once again. However, I don’t believe that restarting it without any new data was likely to bring a different outcome. And at least I don’t consider myself capable of figuring out a solution to such a complex problem and figuring out all the potential issues in a purely theoretical way. Even if that were possible, I don’t believe it would be the most efficient way.

I understand your sentiment, and in fact I share it often. Say, when people give me complex patches without any prior discussion, and I am torn between accepting a patch I disagree with or discarding all the work the user already put into it. However, in this case I do believe prototyping was the appropriate cause of action, and all of us have done with the awareness that the proposal may require significant changes, or even be entirely unsuccessful. And as Jonathan already pointed out, while working on the prototype we’ve hit many issues that we did not anticipate, nor found mentioned in the previous discussions.

Yes, discussing on top of an existing prototype changes the flow of discussion. But more importantly, it means that we have much better understanding of the problem scope, which means that in some cases we will be able to answer concerns and ideas with actual experience and results, rather than theorizing. It also means that the discussion can be more focused, which in turn increases the chances of reaching a consensus rather than diverging in multiple incompatible directions, and of it being open to more people who simply can’t dedicate that much time to read all the possible angles that could come in a more generic discussion.

---

## Post #68 by mgorny

**Created:** 2025-08-15T13:42:03.622Z  
**Replies:** 1 | **Reads:** 108

[quote="pf_moore, post:59, topic:102383"]
Taking a step back from the plugin debate for a moment, this proposal seems to imply a new wheel version (the file name format changes, for example, which is incompatible with the current spec). How have you addressed the well known issues with transition to a new wheel version?

[/quote]

To be honest, I’ve been thinking about this a lot, and the problem is complex. The proposal is designed as a “backwards compatible” extension to the wheel format. By that, I mean that:

1. Wheels that do not use variants do not change at all. There is no reason to change the wheel version there, as it would break backwards compatibility; and we do aim to let packages provide non-variant wheels as a fallback for package managers that do not implement or enable variant wheels.
2. Wheels that use variants change the filename, and as Jonathan pointed out, we have specifically tested that all the common tools will reject them as having an invalid filename. There is no backwards compatibility to be preserved here, and it is implicitly broken by the changed filename anyway.

That considered, I believe that we can raise the wheel version, but I’m not entirely convinced it’s actually necessary and desirable. If we were to raise the version, then at least during some extensive transitional period regular wheels would still have to be published with the old version; possibly “forever”, given there is really no benefit to breaking backwards compatibility for regular wheels.

Another aspect is that there are other open suggestions for improvement of the wheel format (symlinks, new compression algorithms), and if we were to raise the wheel version, we may actually include them as well. Even if it meant that these new features would only be available to wheel variants (since using them would break backwards compatibility), some of the packages needing variants would also benefit from them (e.g. because they’re huge, so they’d use a better compression).

And as a fun idea, variants could then be actually used to combine these new features with backwards compatible regular wheels: say, a package could provide a “null” variant using symlinks, with a no-symlink regular wheel fallback.

---

## Post #69 by mgorny

**Created:** 2025-08-15T14:02:44.020Z  
**Replies:** 0 | **Reads:** 108

[quote="oscarbenjamin, post:56, topic:102383"]
Lastly the proposal here discusses using the variant mechanism for CPU capabilities. The proposal seems perhaps inspired by a previous [thread](https://discuss.python.org/t/selecting-variant-wheels-according-to-a-semi-static-specification/53446) in which I suggested exactly this. I just want to be clear here that I think that micro-architecture variants like `x86_64-v2` etc should really be handled as part of the CPU tag rather than through the variant mechanism that is proposed here. As a temporary or unusual mechanism variants can make sense for CPU capabilities but this should not replace efforts to improve the way that CPU architecture is represented in the main static metadata.

[/quote]

Yes, it is. However, I don’t think it is possible to provide a good solution to more fine-grained CPU architecture specifications within the framework of tags and installers.

The way I see it, platform tags work because Python knows the platform it’s running on. And we can reasonably assume that it knows it, because, well, it needs to actually run on it. With CPU architecture versions, it’s not that simple.

Installers would need to know what architecture version they’re running on, and what versions are compatible with it. They would need to either get that information from Python itself (like they can for platform tags), or carry their own implementation.

Having the code for that in Python interpreter does not sound like a good idea. CPython can happily run on an `x86_64-v4`, even be compiled for `-march=x86_64-v4` or equivalent, without even realizing at the code level that such an architecture level exists. We would have to maintain the detection logic in CPython, backport updates and fixes, and the users using earlier Python versions would be unable to install wheels that are actually valid for their platform. While new architecture versions are relatively rare, and using an older version of Python is a bad idea anyway, I don’t think this justifies rejecting wheels.

Having it in the installer is more realistic, but it means every installer would have to repeat the same logic, and keep it updated and in sync. People would have to upgrade installers to install new wheels; and while admittedly it’s a good idea anyway, and it is definitely easier than updating the Python interpreter itself, it’s still likely to cause some annoyance. It also increases the likeliness of subtle bugs, such as a particular CPU being detected incorrectly, and inconsistent behavior across different tools.

Both approaches also generally assume dumping the maintenance burden on people who often don’t have the relevant hardware, detailed architecture knowledge or even the interest in actively maintaining frameworks for detecting the version of half a dozen different architectures correctly.

I think the provider plugin approach is more suited to the task, as it nominally defers the task to a single package, that will presumably be maintained by someone who has the hardware, the knowledge and the actual interest in it. This package will be released independently of the installers, and (at least within the current framework of the proposal) automatically installed in the newest version available (modulo version constraints), therefore enabling users to take advantage of newer architecture versions faster.

Of course, you could combine the plugin approach with platform tags. However, I think that introduces an unnecessary special case, given that the proposed framework can handle it equally well in a generic way.

---

## Post #70 by mgorny

**Created:** 2025-08-15T14:05:49.117Z  
**Replies:** 1 | **Reads:** 104

[quote="AA-Turner, post:19, topic:102383"]
Being able to quickly tell what a wheel is for is a benefit of the current filename schema. I find the hash-based approach unhelpful as it requires looking up some other data source for what an aribrary hash maps to. Can we find a way to encode the variant type in the filename?

[/quote]

I’m confused by your question. The snippet you’re quoting specifically says that encoding the variant type is possible:

> It can either be a 8-character variant hash, or **a custom string of 1 to 8 ASCII characters from the range `[a-z0-9._]`.**

Or are you suggesting that we remove the fallback of using a hash entirely?

---

## Post #71 by AA-Turner

**Created:** 2025-08-15T14:10:01.692Z  
**Replies:** 1 | **Reads:** 106

[quote="Michał Górny, post:70, topic:102383, username:mgorny"]
The snippet you’re quoting specifically says that encoding the variant type is possible:
[/quote]

It says that it can be a string of up to 8 ASCII characters. How would I encode a package for a CUDA version, an OpenBLAS version, maybe CPU extensions? `cuXX-blasYY-AVXzz` is already too long. ^[ignore the use of hyphens as a separator, used only for illustrative purposes] 

Coming up with novel encoding schemas for each package and project is still part of the problem I mention -- I want to be able to find out what a Wheel (variant) is for, *without* having to resort to external documentation, that might disappear or not even publicly exist in the first place.

---

## Post #72 by pf_moore

**Created:** 2025-08-15T14:15:46.067Z  
**Replies:** 2 | **Reads:** 108

[quote="Michał Górny, post:68, topic:102383, username:mgorny"]
Wheels that use variants change the filename, and as Jonathan pointed out, we have specifically tested that all the common tools will reject them as having an invalid filename.
[/quote]

Pathological example where this isn't the case: `foo-1.0-1none-any-any-12.whl`. Does that have a build number of `1none` or a variant spec of `12`?

Do all tools ignore invalid wheel filenames? I know I used to write a lot of scripts that bulk-processed the contents of PyPI, and I'm pretty sure I never wrote any code to skip invalid wheel filenames. I *definitely* had code that simply counted hyphens, and then split the filename depending on whether there were 5 or 6. That code would break horribly when it encountered the new scheme. I might have had something to log an error and continue, but that's not the same as ignoring them.

[quote="Michał Górny, post:68, topic:102383, username:mgorny"]
There is no backwards compatibility to be preserved here, and it is implicitly broken by the changed filename anyway.
[/quote]

There really is. "A wheel filename contains 5 or 6 hyphens", for example. Or "The tags are the last 3 hyphen-separated fields". Not every tool uses `packaging` to parse wheel filenames, and the standards don't require that they do.

I'm not trying to make things difficult here, but this is definitely something that was discussed some time back on Discourse, and the basic conclusion was that a lot of people felt that the existing versioning system for wheels was inadequate, and we were "stuck" with the current spec until we found a way out of that problem. I'm not seeing anything here that explains how those concerns were addressed, and I don't feel that "we tried things out and it looks like it's OK" really resolves that problem.

---

## Post #73 by AA-Turner

**Created:** 2025-08-15T14:19:42.405Z  
**Replies:** 3 | **Reads:** 106

More generally, I suppose I wonder if something along the lines of the [PEP 780 'ABI features'](https://peps.python.org/pep-0780/) propsal would work here (or, reasons it's been considered and won't work).

If we have a set of environment markers defined for all the reasonable 'variant' axes (e.g. GPU runtime API, GPU driver API, CPU instructions(?), OpenBLAS(?)), and a way of specifying that a wheel requires W, X, Y, and Z in the METADATA, could we make this work statically? It might require range-downloading METADATA files for several wheels, if we're not able to put all of this into the filename, but I would still strongly prefer a static solution for 'variants'.

This preference for static is not just for security reasons but also to simplify the mental model -- I can work through the steps a 'resolver' takes by looking at what my computer offers in terms of supported APIs, and what various wheels require, and match the two up. With arbitrary code, I need to know what is going on case-by-case, and potentially deep in the dependency tree. A static approach means that the algorithm is set by a standards-process, and is easier to explain and comprehend.

A

---

## Post #74 by pf_moore

**Created:** 2025-08-15T14:31:46.461Z  
**Replies:** 0 | **Reads:** 105

[quote="Adam Turner, post:73, topic:102383, username:AA-Turner"]
This preference for static is not just for security reasons but also to simplify the mental model – I can work through the steps a ‘resolver’ takes by looking at what my computer offers in terms of supported APIs, and what various wheels require, and match the two up.
[/quote]

I agree with this. While I'm perfectly happy to concede that this should never happen in practice, a dynamic plugin based system needs to consider what happens when (for example) a plugin does something pathlological like report a different answer every third invocation (which could wreck tools that cache plugin results). This is a real concern for me - we've had so much trouble dealing with sdist builds because setuptools runs arbitrary code at build time, and it's almost impossible to say anything meaningful about sdist builds as a result. It's not even just about malicious code - developers have some insanely weird `setup.py` scripts out there, that we can't just dismiss because they do the job they were built for. (Obvious xkcd link: https://xkcd.com/1172/)

---

## Post #75 by notatallshaw

**Created:** 2025-08-15T14:33:00.250Z  
**Replies:** 1 | **Reads:** 106

[quote="pf_moore, post:72, topic:102383"]
Do all tools ignore invalid wheel filenames?

[/quote]

FWIW pip does not exactly, it has a regex for wheel filenames that is not spec compliant.

We've deprecated invalid name that match this regex for a few releases now, the plan is to ignore all invalid names in pip 25.3.

But there is of course a long tail of older pip installations out there. It's probably worth checking if these variant names match the regex pip uses.

---

## Post #76 by pf_moore

**Created:** 2025-08-15T14:39:25.341Z  
**Replies:** 1 | **Reads:** 106

[quote="Damian Shaw, post:75, topic:102383, username:notatallshaw"]
But there is of course a long tail of older pip installations out there. It’s probably worth checking if these variant names match the regex pip uses.
[/quote]

As I said, it's not just about pip and uv. We can change to be compatible with the new scheme, and compatibility issues with older versions of pip/uv can be addressed. It's about *other* tools that, in good faith, wrote spec-conforming parsers of their own to do a specific, limited job. We shouldn't casually break such tools.

We can complain all we like that the wheel spec was too permissive, and we should have placed tighter limits on what the filename format was, or on how consumers had to handle invalid formats. But we didn't, and we can't just pretend otherwise. We can even *tighten up* the spec. But that's simply taking the compatibility hit *now*, in order to make future work easier, and it doesn't absolve us of the need to provide a transition process for affected users.

---

## Post #77 by notatallshaw

**Created:** 2025-08-15T14:50:34.192Z  
**Replies:** 0 | **Reads:** 105

[quote="pf_moore, post:76, topic:102383"]
We can complain all we like that the wheel spec was too permissive, and we should have placed tighter limits on what the filename format was, or on how consumers had to handle invalid formats.

[/quote]

I've not done a thorough reading of the spec with regards to what consumers should do with invalid names, are you sure it doesn't tell consumers how to behave for invalid names?

But I don't disagree with you, my point was actually that we should also be considerate of popular tools that are **not** spec compliant, like pip, as not to break user workflows.

---

## Post #78 by dstufft

**Created:** 2025-08-15T15:10:41.293Z  
**Replies:** 3 | **Reads:** 105

[quote="steve.dower, post:60, topic:102383"]
Yeah, I’m pretty sure they would just run it. What do you get otherwise? A non-working package?

[/quote]

I also suspect the answer is that most people will just cram the “just make it work” flag into their config, get grumpy that they had to do that, and then forget about it. Which pushes me to think that opt-out might be the right approach unless we can think of a way to square the round peg. Otherwise it feels a bit like we’re compromising usability for ideological reasons? 

But if folks think that most folks won’t just do that, I’m interested to hear that too. Maybe I’m wrong?

[quote="steve.dower, post:60, topic:102383"]
I know you’re pushing towards “malicious code bad”, but the reality is that people who care about malicious code care about *the entire package*, and so it’s all treated as risky. Whether it runs at install time or at first use (and so much malware on PyPI runs on first use, not on install) isn’t that big a difference.

[/quote]

I suspect that what Barry was getting at is that “code that has to be executed” is code that has to be executed whether it’s part of a hypothetical selector package, part of a `setup.py`, part of a build backend, or part of a hypothetical variant plugin.

[quote="pitrou, post:62, topic:102383"]
The most idiomatic and user-friendly solution for this is to adopt dynamic dispatch rather than ship different packages for different CPU support levels.

[/quote]

I think the issue is that packages that are helped by variants tend to also be larger, and if they tried to do a single wheel that did dynamic dispatch they’d likely be well past the limits PyPI has for a single wheel.

---

## Post #79 by ncoghlan

**Created:** 2025-08-15T15:23:11.491Z  
**Replies:** 0 | **Reads:** 107

@pitrou Regarding CUDA versions, you're likely right that it's more like the CPU feature problem (building against an older API version means being compatible with more target environments, but also means missing out on newer hardware features and running slower as a result), so the constraint is "no newer than the provided version" rather than "must be built against exactly the provided version".

My interpretation was based on the way folks have been using venvstacks, which isn't necessarily representative of what the underlying APIs permit.

Regardless, the point of the selector module concept is to allow the *cuda* project to be the one that publishes those variant selection rules (including the runtime hardware interrogation capabilities), rather than build tools and installers having to implement that functionality independently of each other.

---

## Post #80 by notatallshaw

**Created:** 2025-08-15T15:24:58.913Z  
**Replies:** 1 | **Reads:** 110

[quote="dstufft, post:78, topic:102383"]
But if folks think that most folks won’t just do that, I’m interested to hear that too. Maybe I’m wrong?

[/quote]

I’ll just quickly note, as I’ve seen this line of reasoning mentioned a few times and I didn’t address it, that my points earlier in the thread about opt in vs. opt out aren’t about satisfying **most** users.

They’re about satisfying users who have done an analysis of what they consider safe and having that analysis invalidated with no warning.

I agree most users just want things to work.

---

## Post #81 by Liz

**Created:** 2025-08-15T15:46:11.909Z  
**Replies:** 1 | **Reads:** 110

[quote="davidism, post:5, topic:102383"]
A huge, advertised benefit of the wheel format is that there is no code executed. Yes, if you need to *build* the wheel, there is code executed, but once you have the wheel you *know* it is statically installable.

[/quote]

I had to wait for written confirmation that an internal tool was not considered secret. I also have been asked to say that this is not a formal request from my employer, and that we’ll work around this if the community goes through with it anyway.

The fact that this is even being seriously considered has shaken faith in some of our internal tooling. 

The example of this I have and needed to get permission to speak about involves static analysis. 

We download (using `pip download --only-binary=:all:`, but it isn't clear to me that variants don't count as binaries, and the proposal leaves this up to individual tools?) dependencies regularly and analyze statically to check for API changes in libraries. We do also read the changelogs, this isn't abdication of review process, but a tool meant to spot changes we might be impacted by sooner. Everything from docstrings changing to calling convention changing is detected statically, and we get automatic notes to verify specific things.  This runs regularly, prior to even getting to the point of asking our security team to approve a version for production use. (we have an internal wheelhouse, and build ourselves). That this is even being considered when wheels were supposed to not execute code on download has caused that tool to be frozen and flagged for reassesment of risk, because we can't know going forward that the community will not change an important property of wheels in the future.

We were specifically using pip in a script to do this to match the resolver logic without having to reimplement it, and without importing pip (which pip does not support use in that way)

---

## Post #82 by zanie

**Created:** 2025-08-15T16:19:20.361Z  
**Replies:** 2 | **Reads:** 106

[quote="Elizabeth King, post:81, topic:102383, username:Liz"]
We download (using `pip download --only-binary=:all:`, but it isn’t clear to me that variants don’t count as binaries, and the proposal leaves this up to individual tools?) [...] That this is even being considered when wheels were supposed to not execute code on download has caused that tool to be frozen and flagged for reassesment of risk
[/quote]

To be clear here, variants _are_ still binary wheels.

The behavior of `pip download` is specific to that tool. Whether pip (or any other tool) decides to execute third-party code is not determined by a specification, it can choose to do at any time.

I do not think this specification should _require_ any tool to execute third-party code (i.e., variant providers). Right now, the verbiage is that installers "should" use providers to determine available variants. I don't even think that's necessary, it seems fine for it to be "may".

The intent of the specification is to create a structure that allows packages to express variants and gives tools the _choice_ to invoke providers to determine the variants to use for wheel selection and validation.

---

## Post #83 by dstufft

**Created:** 2025-08-15T16:29:10.412Z  
**Replies:** 3 | **Reads:** 106

[quote="notatallshaw, post:80, topic:102383"]
I’ll just quickly note, as I’ve seen this line of reasoning mentioned a few times and I didn’t address it, that my points earlier in the thread about opt in vs. opt out aren’t about satisfying **most** users.

They’re about satisfying users who have done an analysis of what they consider safe and having that analysis invalidated with no warning.

[/quote]

I’ve not seen anything that requires (or even suggests) making any sort of change without warning ^[Funny thing, the spec never requires, guarantees, or even mentions that wheels avoid code execution, just that they avoid needing to install build tools. Though I think conventionally everyone generally expects that currently. Gotta love the ambigiutiy of the old specs :frowning: ].

At least in my head, the questions of “is this the right change” and “how do we communicate this change” are related, but separate questions.

---

## Post #84 by Liz

**Created:** 2025-08-15T16:54:08.784Z  
**Replies:** 1 | **Reads:** 104

[quote="Zanie Blue, post:82, topic:102383, username:zanie"]
The behavior of `pip download` is specific to that tool. Whether pip (or any other tool) decides to execute third-party code is not determined by a specification, it can choose to do at any time.
[/quote]

The behavior of unpacking a wheel is very specified. At no point is any code within the wheel executed in that specification. This changes that, and attempting to gloss over existing behavior and assumptions that were part of the format we were sold as an improvement from source distributions that people rely on isn't helping with the perception that this is a change we are going to have to redesign our processes around this.

Yes, pip could decide to do something not specified with the current wheel specification, but if it did that in a way that executed code provided by wheels it was downloading, we'd discard all trust we have for pip. This is instead specifying that wheels can provide code that can be executed to determine what to install.

---

## Post #85 by charliermarsh

**Created:** 2025-08-15T17:05:40.574Z  
**Replies:** 0 | **Reads:** 109

[quote="AA-Turner, post:73, topic:102383"]
If we have a set of environment markers defined for all the reasonable ‘variant’ axes (e.g. GPU runtime API, GPU driver API, CPU instructions(?), OpenBLAS(?)), and a way of specifying that a wheel requires W, X, Y, and Z in the METADATA, could we make this work statically? It might require range-downloading METADATA files for several wheels, if we’re not able to put all of this into the filename, but I would still strongly prefer a static solution for ‘variants’.

[/quote]

Yeah, I think this might be doable if we’re willing to constrain the set of axes and govern them through standards, i.e., create environment markers (e.g., add `cuda_version_lower_bound` and `sm_arch` environment markers) for these things and (presumedly) encode them in wheel tags. (I would need to run through a few examples to figure out the sticking points with all we’ve learned from the current design.) That approach does have downsides, though. In that world, we’re signing up to maintain the available markers and their semantics through standards when many of them will ultimately be vendor- or tool-specific. We also need standardized implementations of all the various providers for detection, which will require coordination with vendors (like NVIDIA – defining and detecting these properties is not totally trivial). Package managers would need to vendor those implementations, etc. Part of the thinking behind the current design is that it enables this development to happen without requiring constant changes to specifications by standardizing on the general schema and principles (variants). I don’t mind pushing on that concept though. It ends up being similar to variants, but with a pre-defined set of properties and providers that are governed by a standard.

Edit: Just as an example: if NVIDIA introduced a new versioning scheme, then in this world, we’d need to update the standard / specification to include that new marker, add an implementation for it, and propagate those changes to the marker grammar and the corresponding detection implementation to all packaging tools.

---

## Post #86 by charliermarsh

**Created:** 2025-08-15T17:19:06.346Z  
**Replies:** 2 | **Reads:** 106

[quote="Liz, post:84, topic:102383"]
The behavior of unpacking a wheel is very specified. At no point is any code within the wheel executed in that specification. This changes that, and attempting to gloss over existing behavior and assumptions that were part of the format we were sold as an improvement from source distributions that people rely on isn’t helping with the perception that this is a change we are going to have to redesign our processes around this.

Yes, pip could decide to do something not specified with the current wheel specification, but if it did that in a way that executed code provided by wheels it was downloading, we’d discard all trust we have for pip. This is instead specifying that wheels can provide code that can be executed to determine what to install.

[/quote]

I’m not looking to debate the sentiment behind your comment or gloss over any changes but I do feel the need to clarify a few details because I want to make sure the proposal is well-understood in this thread:

* Unpacking a wheel does not require executing code. The wheel variant specification does not change this.
* Wheels themselves do not provide code that can be executed to determine what to install. A JSON file is published alongside the wheels that lists the available variants, the features they require, and the providers that you can run to determine whether those features are available on your machine. You can still install a wheel without running any code, if you know what wheel you want. You should also be able to define, in advance, the set of features that you want the installer to “assume” are available on your machine, without running any of the provider code. If you want the installer to infer the correct wheel automatically, then it would need to run the provider code.

---

## Post #87 by Liz

**Created:** 2025-08-15T17:22:37.570Z  
**Replies:** 1 | **Reads:** 100

Replying to your footnote that discourse won't quote, I think it's a reasonable assumption that we aren't executing random code without a specification for it, and the pep that introduced wheels specifically called out arbitrary code being run as part of the rationale. If people actually think it's reasonable to execute remotely downloaded code without user input or specification, when the specification only provides that it's a zipfile and what to do with those files, then I think we have a serious problem in terms of what people are presenting as reasonable behavior, and all future specifications would need language "installers must not do things not specified....". The absence of that language does not make doing so reasonable.

---

## Post #88 by jamestwebber

**Created:** 2025-08-15T17:25:46.220Z  
**Replies:** 0 | **Reads:** 103

[quote="charliermarsh, post:86, topic:102383"]
You can still install a wheel without running any code, if you know what wheel you want. You should also be able to define, in advance, the set of features that you want the installer to “assume” are available on your machine, without running any of the provider code. If you want the installer to infer the correct wheel automatically, then it would need to run the provider code.

[/quote]

I’m sure this has been discussed in the WheelNext group, but to throw out a more opt-in flavor of this proposal:

* Wheel variants exist as proposed: a package publishes a JSON of wheels and the features they each require
* A standard is developed for installers to support wheel-variant plugins
* The *user* must opt to install the plugin for any given feature they care about
  * e.g.  if I have a GPU and I want my installer to automatically choose the best wheel for my GPU, I need to install the GPU-variant-plugin^[and configure it, unless that plugin is going to run on install].
  * Installers *may* try to automatically determine the appropriate plugins when *they* are installed, but this is configurable.
  * Like any other package, these plugins are voluntarily installed and can be audited by those who wish to do so.
* Upon `[installer] install foo`, the installer will consider the variants available and the plugins installed and choose a wheel accordingly.
  * If I ask for generic `pytorch` and didn’t install a GPU-variant-plugin then I’m gonna get the CPU version

---

## Post #89 by notatallshaw

**Created:** 2025-08-15T17:25:56.996Z  
**Replies:** 0 | **Reads:** 102

[quote="dstufft, post:83, topic:102383"]
I’ve not seen anything that requires (or even suggests) making any sort of change without warning

At least in my head, the questions of “is this the right change” and “how do we communicate this change” are related, but separate questions.

[/quote]

To resummarize my earlier posts in this context:

The current proposal says it should be opt out, not opt in. If a tool was to adopt this immediately as opt out I would consider that as no warning. Regardless of any other sort of user out reach.

To provide sufficient warning I think it **must** start as opt in (at least for existing tools) and then it can be up to the tool how to communicate and transition to opt out, assuming that's agreed on recommended default.

---

## Post #90 by mikeshardmind

**Created:** 2025-08-15T17:30:35.287Z  
**Replies:** 0 | **Reads:** 97

[quote="Charlie Marsh, post:86, topic:102383, username:charliermarsh"]
and the providers that you can run to determine whether those features are available on your machine.
[/quote]

I feel like this is actually a problem. This is a remote file providing something to run in a context where something previously wouldn't be run. Whether the existing expectations people have are well-specified or not, they do seem to me as reasonable expectations that are being broken here, and making this something that tools can choose to do means the mental model people have will no longer be packaging standard focused, but tool specific.

---

## Post #91 by dstufft

**Created:** 2025-08-15T17:38:42.887Z  
**Replies:** 1 | **Reads:** 100

[quote="Liz, post:87, topic:102383"]
Replying to your footnote that discourse won’t quote, I think it’s a reasonable assumption that we aren’t executing random code without a specification for it, and the pep that introduced wheels specifically called out arbitrary code being run as part of the rationale. If people actually think it’s reasonable to execute remotely downloaded code without user input or specification, when the specification only provides that it’s a zipfile and what to do with those files, then I think we have a serious problem in terms of what people are presenting as reasonable behavior, and all future specifications would need language “installers must not do things not specified…”. The absence of that language does not make doing so reasonable.

[/quote]

Eh.

I put that in a footnote specifically because I don’t think that “the spec doesn’t say this” isn’t really a great argument for anything, but I think people are being a little disingenuous when they’re using that as an argument.

I think that wheels allow you to avoid code execution is a good and useful feature, that isn’t promised by the spec, but that people are currently relying on. Which I think is a lot stronger argument than trying to nitpick over what some ambigiously worded phrase from 13 years ago meant.

[quote="Liz, post:87, topic:102383"]
If people actually think it’s reasonable to execute remotely downloaded code without user input or specification, when the specification only provides that it’s a zipfile and what to do with those files, then I think we have a serious problem in terms of what people are presenting as reasonable behavior, and all future specifications would need language “installers must not do things not specified…”.

[/quote]

I think it can be reasonable. It can also be unreasonable. Life and Engineering is about trade offs not absolutes. Maybe this feature the trade offs are worth it, maybe they’re not. Software exists to evolve with the needs of the day or it gets replaced.

---

## Post #92 by pf_moore

**Created:** 2025-08-15T18:05:06.575Z  
**Replies:** 2 | **Reads:** 101

[quote="Donald Stufft, post:83, topic:102383, username:dstufft"]
At least in my head, the questions of “is this the right change” and “how do we communicate this change” are related, but separate questions.
[/quote]

... and the intersection of those two questions is the "How do we teach this?" section of a PEP. And any specification of a transition plan in a PEP.

I'm used to evaluating PEPs, so for me, answering the question "is this the right change" without havning good information about how the change authors propose that we communicate the change and handle transition is pretty much impossible. It's not the right change if we can't educate people about the impact, or manage the disruption caused by the change.

[quote="Zanie Blue, post:82, topic:102383, username:zanie"]
The intent of the specification is to create a structure that allows packages to express variants and gives tools the *choice* to invoke providers to determine the variants to use for wheel selection and validation.
[/quote]

I think the way the discussion has been going here, there's a very clear suggestion that the proposers *expect* automatic evaluation of the selector plugins, and a lot of comments are being made from a perspective where that's the norm.

I think it would be much easier to have this discussion if the proposal was carefully neutral over how selector plugins get executed. For now, omit all discussion of *how* the consumer knows whether the target environment supports selector XYZ, and concentrate on how the right wheel will be picked assuming the answer is known. This is very much like the existing wheel tags - the spec describes how a wheel is selected based on tags, but says nothinng about how tools know what tags the environment supports.

By doing this, we can have a discussion about the mechanism in the abstract, without the underlying approach being eclipsed by the question of "running arbitrary code".

Then, as a *separate* discussion, we can debate how we handle selector evaluation for environments. That could be as simple (and vague) as "tools have to invent their own mechanism and there's no standard", or a static approach that allows the user to build an environment spec file, probably by using tools that implement the same code as the proposed plugins do, or a fully dynamic and automatic approach using load-on-demand plugins. We can define the minimum approach that tools *must* support, and we can define interoperability standards for more complex approaches, so that tools can share and reuse selection code. That discussion can also establish standards and guidelines around how to handle security, reproducibility, trust, and all of the other issues that the "dynamic plugins" approach is raising.

---

## Post #93 by mgorny

**Created:** 2025-08-15T18:17:40.096Z  
**Replies:** 1 | **Reads:** 97

[quote="pf_moore, post:72, topic:102383"]
Pathological example where this isn’t the case: `foo-1.0-1none-any-any-12.whl`. Does that have a build number of `1none` or a variant spec of `12`?

[/quote]

Does it matter? `any` is not a supported Python tag.

> Do all tools ignore invalid wheel filenames? I know I used to write a lot of scripts that bulk-processed the contents of PyPI, and I’m pretty sure I never wrote any code to skip invalid wheel filenames.

Does your tool happen to verify wheel version?

Besides, our goal wasn’t to make sure that no tool ever could do anything about a variant wheel without explicitly being updated for it. Our goal was to ensure that *installers* won’t *accidentally* install them.

---

## Post #94 by mgorny

**Created:** 2025-08-15T18:21:35.044Z  
**Replies:** 0 | **Reads:** 103

[quote="AA-Turner, post:71, topic:102383"]
It says that it can be a string of up to 8 ASCII characters. How would I encode a package for a CUDA version, an OpenBLAS version, maybe CPU extensions? `cuXX-blasYY-AVXzz` is already too long.

[/quote]

Well, if you asked me, I’d be happy to allow arbitrary lengths. However, this was debated in https://github.com/wheelnext/pep_xxx_wheel_variants/issues/5, and 8 characters were a kind of compromise. To cite the linked specification:

> The label length is strictly limited to prevent the wheel filenames to become much longer than they are now, and causing issues on systems with smaller filename or path length limits.

I don’t think it impossible to agree on a longer limit.

---

## Post #95 by mgorny

**Created:** 2025-08-15T18:31:50.409Z  
**Replies:** 0 | **Reads:** 106

Okay, perhaps we should have made one point clearer: the specification as linked has been frozen at some point to be able to test the current implementation. As the [security implications](https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#security-implications) section proves, we are aware of the issues with opt-out approach, and we are definitely going to address them. We did not discard them as irrelevant; we deferred working on them until the other technical details are more settled, and we have a clearer idea of what the solution space is.

---

## Post #96 by brettcannon

**Created:** 2025-08-15T18:37:14.438Z  
**Replies:** 0 | **Reads:** 108

Since I keep seeing people being confused as to when providers would plug into the resolution and installation story, here’s some pseudocode to help illustrate where providers would come into play (based on my understanding):

```python
while unresolved_deps(context):
    dep = get_next_unresolved_dep(context)
    release = resolve(dep, context)
    wheel = find_wheel(release)
    add_wheel(context, wheel)
for wheel in wheels(context):
    install(wheel)


def find_wheel(release):
    for tag in platform_tags(release):
        if tag in release:
            return release[tag]
    raise Exception("No compatible wheel found")


def platform_tags(release):
    variants = []
    for provider in get_providers(release):
        new_variants = provider() # ⚠️ 3rd-party code execution.
        variants.extend(new_variants)
    yield from add_variants(packaging.tags.sys_tags())
```

Notice the execution is only at the step of *choosing* a wheel, not *installing* one.

I’m purposefully not commenting on the proposal, just trying to help clarify a key detail.

---

## Post #97 by mgorny

**Created:** 2025-08-15T18:48:11.786Z  
**Replies:** 1 | **Reads:** 109

[quote="AA-Turner, post:73, topic:102383"]
If we have a set of environment markers defined for all the reasonable ‘variant’ axes (e.g. GPU runtime API, GPU driver API, CPU instructions(?), OpenBLAS(?)), and a way of specifying that a wheel requires W, X, Y, and Z in the METADATA, could we make this work statically?

[/quote]

Of course we can. However, that would imply that:

1. We would have to centrally approve and design every variant axis.
2. We would have to centrally maintain implementations of every axis for every possible system, and keep updating it to account for new values that can’t be predicted.
3. The users would have to keep updating the relevant tools (installers? CPython?) to take advantage of new values that were just implemented.
4. If our design turns out to be incorrect and does not work for some package, we end up either telling them “sorry, can’t do” or implementing a replacement axis to cover the new use case.

I’m not saying that it’s impossible. However, in my opinion this is going to be a significant effort and maintenance burden. We are talking about people having to centrally maintain support for hardware they don’t have, platforms they aren’t able to use, and in the end, they won’t be able to reliably tests that they still work.

Compared to that, decentralized (or even semi-decentralized, if we consider vetting available plugins) system has the advantage that:

1. Plugins for specific variants are maintained by people with direct stake in these variants, who are knowledgeable about the hardware in question and able to test them.
2. Plugins can be released and updated independently, to account for changes required by specific variants.
3. If an existing plugin for a given topic does not fit the needs of your package, you can always create a new plugin that does it better.

By no means I am claiming that this a perfect solution. On the contrary, it is a solution designed to work in an imperfect world.

---

## Post #98 by barry

**Created:** 2025-08-15T19:12:13.503Z  
**Replies:** 0 | **Reads:** 107

[quote="Paul Moore, post:92, topic:102383, username:pf_moore"]
I think it would be much easier to have this discussion if the proposal was carefully neutral over how selector plugins get executed. For now, omit all discussion of *how* the consumer knows whether the target environment supports selector XYZ, and concentrate on how the right wheel will be picked assuming the answer is known.
[/quote]

I think this makes a lot of sense, especially as the variants proposal moves to formal PEP stage.  This would be especially helpful in order to keep the PEPs "reasonable" in size and comprehensibility.   One PEP could be a Standards Track PEP describing the mechanisms, file formats, etc. of how a static selector matrix is used to resolve wheel variants, and the other could be an Informational PEP giving (non-binding) guidance and recommendations to the tool ecosystem for how they might implement the discovery of machine capabilities and how that maps into the variant resolution process.

---

## Post #99 by fungi

**Created:** 2025-08-15T19:17:30.000Z  
**Replies:** 1 | **Reads:** 109

> The tension here is between secure-by-default and maximising convenience in the common case especially for novice users.

I'm singling out this particular misconception with an important reminder that it's not the dichotomy a lot of people seem to think it is. Novice users are the ones *most* in need of secure-by-default solutions because they don't understand the risks enough to know what should be secured, much less how to do so.

---

## Post #100 by barry

**Created:** 2025-08-15T19:19:09.085Z  
**Replies:** 1 | **Reads:** 109

[quote="Donald Stufft, post:78, topic:102383, username:dstufft"]
I suspect that what Barry was getting at is that “code that has to be executed” is code that has to be executed whether it’s part of a hypothetical selector package, part of a `setup.py`, part of a build backend, or part of a hypothetical variant plugin.
[/quote]

Indeed.  I think I understand what @steve.dower was suggesting now, which is effectively "fat" binary wheels that support every possible variant, along with runtime code that "imports"^[or otherwise loads or enables] the right bits of that fat binary.  Apologies if I still misunderstand.

[quote="Donald Stufft, post:78, topic:102383, username:dstufft"]
I think the issue is that packages that are helped by variants tend to also be larger, and if they tried to do a single wheel that did dynamic dispatch they’d likely be well past the limits PyPI has for a single wheel.
[/quote]

That's indeed the problem.  This stuff can get *huge*, and even if wheel size limits weren't a problem^[and I don't think they should be but that's a whole 'nuther tangent we don't need to go into here] being able to download just the bits you need will provide a much better end user experience.

---

## Post #101 by pf_moore

**Created:** 2025-08-15T19:19:58.781Z  
**Replies:** 1 | **Reads:** 106

[quote="Michał Górny, post:93, topic:102383, username:mgorny"]
Does it matter? `any` is not a supported Python tag.
[/quote]

There's no standard that says `any` isn't a valid Python tag. I already said this was a pathological case, so I'm not trying to defend the example. Just trying to say that it's *possible* to have a wheel filename which can't be reliably identified as being in the old or new format, based on existing standards.

As I said, I did a lot of scanning of PyPI data at one time. There's some *very* broken (but still valid) cases out there.

[quote="Michał Górny, post:93, topic:102383, username:mgorny"]
Does your tool happen to verify wheel version?
[/quote]

No, it doesn't. The one I'm thinking of right now was a bulk scan of all of PyPI, and downloading wheels just to verify the version was impractical. I only wanted the components of the wheel filename, and I did the bare minimum the spec allowed (split on hyphen, assign the 5 or 6 components to the relevant fields). I didn't expect my code to be bulletproof, but I *did* ensure that it was correct, and wouldn't be arbitrarily broken by future changes to the ecosystem, by carefully following the standards. I don't feel supported by the community if it turns out that care was in vain. Don't misunderstand - the code is pretty easy to change, and I can adapt it to new standards without much effort (if I even do - my need for the data is not as pressing these days). But like @Liz, I feel that changing the guarantees without a proper transition feels like a broken promise.

[quote="Michał Górny, post:93, topic:102383, username:mgorny"]
Besides, our goal wasn’t to make sure that no tool ever could do anything about a variant wheel without explicitly being updated for it. Our goal was to ensure that *installers* won’t *accidentally* install them.
[/quote]

OK, but a *standard* needs to ensure that we don't break any working code without a justification and a transition plan. As @Liz pointed out, users' trust in the Python packaging ecosystem is fragile, and we cannot afford to be seen as not caring about stability and compatibility.

The old standards (like the wheel spec) were written in a very different time, when Python was nowhere near as popular, and packages were far less complex. As a result, those standards fall far short of the levels of precision and tightness that we'd expect today. That's a huge problem, but it's one we have to deal with. It's very reasonable to argue that we need a compatibility break in order to fix problems caused by the state of older standards, but we still have to provide our users with reasonable warnings and transition processes. It's one thing to say "this will hurt, but it's necessary", and I'm fine with that - but it's something completely different to say "we're not going to help you manage that necessary pain".

---

## Post #102 by barry

**Created:** 2025-08-15T19:30:32.338Z  
**Replies:** 0 | **Reads:** 103

[quote="Michał Górny, post:97, topic:102383, username:mgorny"]
We are talking about people having to centrally maintain support for hardware they don’t have, platforms they aren’t able to use, and in the end, they won’t be able to reliably tests that they still work.
[/quote]

I argued early in the variants discussion that this makes a centrally managed solution untenable, and I still think that's the case.

I don't maintain installer tools, but I maintain enough open source that I am always *extremely* hesitant^[to the point of outright rejection] to accept changes that I don't understand or can't test, and I suspect the pip maintainers would be especially so, given the impact on the ecosystem of a bad change.  

I also don't see this reasonably as being added to the Python stdlib, where again, the risk aversion is very high.

Besides all that, as was mentioned, the release cycle and long tails of both projects just increase the infeasibility of a centrally maintained solution (at least at the interpreter or installer level).

A middle ground *could* be a central repository, maybe something along the lines of [typeshed](https://github.com/python/typeshed) where the collection of variant resolvers is centrally and collaboratively maintained.   This could mean that an installer would only have to trust *one* provider which would basically be an amalgam of all the individual system capability providers.  That would at least reduce the surface area to a single dependency which likely could use modern supply chain guarantees.

---

## Post #103 by barry

**Created:** 2025-08-15T19:31:45.927Z  
**Replies:** 0 | **Reads:** 103

[quote="fungi, post:99, topic:102383, username:fungi"]
Novice users are the ones *most* in need of secure-by-default solutions because they don’t understand the risks enough to know what should be secured, much less how to do so.
[/quote]

They're also the ones least able to navigate the complexity of system capabilities to craft an efficient and functioning environment to run this complex software stack.  There lies the tension.

---

## Post #104 by barry

**Created:** 2025-08-15T19:36:21.901Z  
**Replies:** 0 | **Reads:** 106

[quote="Paul Moore, post:101, topic:102383, username:pf_moore"]
The old standards (like the wheel spec) were written in a very different time, when Python was nowhere near as popular, and packages were far less complex. As a result, those standards fall far short of the levels of precision and tightness that we’d expect today.
[/quote]

I think we also have to recognize that we as a community here on DPO are probably unaware of the majority of code out there.  There's just no way to even know if a change you're making is going to break something.  Or better yet, you have to assume it probably will, for someone.

That's just a risk we have to internalize by building software that millions of other people are going to use, most of whom are completely detached from all these discussions.

---

## Post #105 by steve.dower

**Created:** 2025-08-15T19:40:11.285Z  
**Replies:** 1 | **Reads:** 109

[quote="Barry Warsaw, post:100, topic:102383, username:barry"]
I think I understand what @steve.dower was suggesting now, which is effectively “fat” binary wheels that support every possible variant, along with runtime code that “imports” the right bits of that fat binary. Apologies if I still misunderstand.
[/quote]

That's closer to what Antoine was suggesting ("runtime dispatch"), but I've suggested it in the past, and I think it's a great way to set the whole thing up. But I'd expect the "fat" wheel to often be a set of partial wheels, so they can all install simultaneously and produce a "fat" install (that dispatches at runtime). e.g. if you have a range of CUDA versions to support and each is ~1GB of wheel, then don't put them all in a single wheel, but _do_ let them be installable simultaneously and include the internal logic to import the right one (e.g. by making the _wrong_ ones fail with a nice `ImportError` and catching that).

My main suggestion here was in using the name of the package as the variant identifier, not adding a new field. So rather than `foo-1.0.0-cp314-win_amd64-WEIRD_HASH.whl` we'd just have `foo_cu12-cp314-win_amd64.whl` (and packages can then choose whatever granularity they want, because they fully control the "cu12" part - @mgorny covered this well in an earlier post, but trying to control all the dimensions upstream is not going to work, and the easiest way to push it all down to the publisher is to just put it in the name).

In case it's not obvious,[^1] `foo_cu12` doesn't literally install `foo_cu12` and require users to `import foo_cu12`. It might install `site-packages/foo/_cu12` and then `site-packages/foo/__init__.py` can `from ._cu12 import ...` with a fallback if the module/package isn't there. So neither source code nor the list of requirements has to specify anything other than `foo`, but the package developer can decide what code `import foo` should _actually_ execute (as today, no change here) and what `pip install foo` should _actually_ install based on the target system (this is the new bit).

[^1]: I think it's very obvious, but the responses suggest that it's not.

---

## Post #106 by barry

**Created:** 2025-08-15T20:56:31.418Z  
**Replies:** 1 | **Reads:** 105

[quote="Steve Dower, post:105, topic:102383, username:steve.dower"]
if you have a range of CUDA versions to support and each is ~1GB of wheel, then don’t put them all in a single wheel, but *do* let them be installable simultaneously
[/quote]

I think there are two problems with this approach.  One is more global in the sense that even if you could make this work for one capability dimension (e.g. cuda version), it quickly becomes untenable when you have to deal with multiple dimensions, e.g. gpu version, cpu instruction set, etc. across many multiple platforms.

The other problem is more "local", meaning, let's say this even worked.  Imagine every release now includes dozens if not hundreds of individual component wheels implemented as separate packages, *and* a "meta" package that had all the right dependencies and did the runtime dispatch.  How do you even release this stack in a consistent, coherent way?  It might take hours or days to get everything uploaded and tested, and one bad wheel in that stack will be a major headache to fix.  [PEP 694](https://peps.python.org/pep-0694/) could help, but even with stageable upload mechanism, there's no way to do atomic releases across more than one package^[and I'm not even sure PyPI/warehouse could possibly support that even if there was a protocol for expressing in, which 694 definitely isn't].   So now you've for sure got race conditions which will break your environments if you're unlucky.

In a variants world, at least you're localizing your uploads to a single package so 694 could help a lot in that scenario.

---

## Post #107 by BrenBarn

**Created:** 2025-08-16T07:17:24.269Z  
**Replies:** 3 | **Reads:** 100

For me this is another case where the desire to improve incrementally handicaps the proposal because the incremental change is not beneficial enough to be worth the disruption (even though the disruption is smaller).  As in, an improvement of 100 "goodness units" may be worth paying 100 "disruption points", but an improvement of only 10 goodness units may not be worth paying 10 disruption points.

I'll avoid restating a bunch of examples of why I think this, but just to stick to one thing that's specifically part of this proposal: It is just obvious to me that using the filename to store important metadata is entirely unsustainable.  I will go out on a limb and guarantee that down the line we will have some other bit of metadata that we think we really really need, and an 8-character string at the end of the wheel filename will not be enough.

There is no realistic path forward without shifting to a system which is based around having metadata stored, served, and processed separately from the package.  This makes some things more complicated because you can no longer "just look at the filename", but that is the point: the amount of information we eventually may want is definitely going to be larger and more complicated than any single hyphen-delimited string we can "just look at".

---

## Post #108 by pitrou

**Created:** 2025-08-16T08:20:45.954Z  
**Replies:** 2 | **Reads:** 101

[quote="Donald Stufft, post:78, topic:102383, username:dstufft"]
I think the issue is that packages that are helped by variants tend to also be larger, and if they tried to do a single wheel that did dynamic dispatch they’d likely be well past the limits PyPI has for a single wheel.
[/quote]

But on the flip side, shipping separate variants for each CPU level will increase their storage footprint on PyPI even more. I don't have numbers, but most packages have a relatively small (or even tiny) proportion of dynamically-dispatched code - usually in low-level performance-critical loops.

---

## Post #109 by pitrou

**Created:** 2025-08-16T08:36:11.152Z  
**Replies:** 0 | **Reads:** 99

[quote="Barry Warsaw, post:106, topic:102383, username:barry"]
One is more global in the sense that even if you could make this work for one capability dimension (e.g. cuda version), it quickly becomes untenable when you have to deal with multiple dimensions, e.g. gpu version, cpu instruction set, etc. across many multiple platforms.
[/quote]

Isn't this an argument against wheel variants as well? Do you really want to generate and host ^[Or let PyPI host] the hundreds of slightly different builds of your package for all supported CUDA versions and CPU support levels? It might be much worse than adding dynamic dispatch for the few select portions of code where it matters.

But at the end of the day, the problem might be the existence of mammoth packages that try to include every potentially useful functionality under a single namespace and a single convenient install ^[Which might be not be that convenient given its size!]. The "single convenient install" aspiration might be better served by well-advertised meta packages, rather than shipping everything into a single package.

---

## Post #110 by mgorny

**Created:** 2025-08-16T10:20:25.311Z  
**Replies:** 0 | **Reads:** 97

[quote="BrenBarn, post:107, topic:102383"]
I’ll avoid restating a bunch of examples of why I think this, but just to stick to one thing that’s specifically part of this proposal: It is just obvious to me that using the filename to store important metadata is entirely unsustainable.

[/quote]

The proposal doesn’t store any “important information” in the filename. All the variant information is stored inside the wheel’s `.dist-info` directory, and replicated into a separate JSON file on the index for dispatching. The only thing stored in the filename is a unique identifier, whose sole purpose is being able to actually have multiple files to dispatch from.

---

## Post #111 by pf_moore

**Created:** 2025-08-16T10:59:49.341Z  
**Replies:** 1 | **Reads:** 100

Serious question - why not create a *brand new* format, independent of the wheel format, and use that for the variant proposal (and all the other new wheel features we want). Tools can learn to treat this new format as a second binary format, and we don't have to stick with the constraints that the wheel format imposes on backward compatibility.

We shouldn't need a new build backend interface - the wheel format remains fine for builds that target a single environment, and the new format can have the capability to "point to" wheels, just like the existing variant proposal does. We'd need new tools to take a set of environment-specific wheels and assemble a new-wheel file with variant pointers, but that's fine - this capability is only needed by a limited number of projects, and making them do a little more work by adapting their workflow to add a new "assemble variant distribution" step doesn't seem unreasonable.

There would be a transition cost, of course, but as I said in an earlier message, I don't think there's any solution that can realistically avoid a transition cost, no matter how much we might like to hope that we can.

---

## Post #112 by mgorny

**Created:** 2025-08-16T11:28:39.700Z  
**Replies:** 1 | **Reads:** 98

In my opinion, creating an entirely new format for a minor addition like this would be an overkill. Of course, if we collected many more features than that, it would perhaps be justified — as in a “Wheel 2.0”. However, with what this proposal involves right now, the new format would basically be “just like wheel, except for this additional file”.

I would also like to repeat that one of the points here was to actually preserve a degree of backwards compatibility. Yes, we do not want variant wheels to be installed accidentally. However, there is no reason to unnecessarily break compatibility with other tools. Admittedly, this is unavoidable with the changed filenames, but at least “dumb” tools that don’t validate the filename should not be affected. And since the “guts” of the format don’t really change, they may continue working just fine, or require absolutely minimal changes.

Admittedly, we can’t predict all possible use cases. There are tools that could work with variant wheels just fine, but will reject them because of the filename. There are also probably tools that won’t handle variant wheels properly, yet will accept them because they don’t validate filename. There is always a risk, but the real question is: is breaking *all* backwards compatibility really worth it? Being careful may be a good thing, but it may also cause a lot of unnecessary friction and pain.

---

## Post #113 by dstufft

**Created:** 2025-08-16T14:24:48.707Z  
**Replies:** 1 | **Reads:** 97

[quote="BrenBarn, post:107, topic:102383"]
There is no realistic path forward without shifting to a system which is based around having metadata stored, served, and processed separately from the package. This makes some things more complicated because you can no longer “just look at the filename”, but that is the point: the amount of information we eventually may want is definitely going to be larger and more complicated than any single hyphen-delimited string we can “just look at”.

[/quote]

We already can look at the metadata and do not need to rely on *just* the filename.

* The `METADATA` can be lifted up and fetched independently of the artifact itself (and on PyPI this is happening for all wheel files).
* The Simple API has several properties that have been lifted out of the artifact and into the API response itself.
* The proposal in this thread adds a variants response to the simple API to allow querying the variant metadata.

From a technical POV, we *need* something in the filename because PyPI requires unique filenames, but that’s something we could relax if we wanted to.

However, I think it’s still useful to have *something* in the filename, if for no other reason than it helps provide some indication to a human looking at a list of 50 files what’s different about them.

[quote="pitrou, post:108, topic:102383"]
But on the flip side, shipping separate variants for each CPU level will increase their storage footprint on PyPI even more. I don’t have numbers, but most packages have a relatively small (or even tiny) proportion of dynamically-dispatched code - usually in low-level performance-critical loops.

[/quote]

I have no idea what the % would be here, so I can’t really speak on it. If the increase is tiny then that might be workable. If the increase is large then it may not be. 

Currently PyPI has a 1GB hard limit on the size of an individual wheel that cannot be raised IIRC, but bandwidth is our most expensive “bill” so whatever minimizes transferring unneeded “stuff” the most is a win from PyPI’s POV. 

My *guess* is that if dynamic dispatch worked well enough for these use cases that would already be used rather than the awful hacks that exist today, but I have nothing to base that on besides a guess? Someone who understands the specific problem space better would have to answer.

---

## Post #114 by mgorny

**Created:** 2025-08-16T15:04:26.140Z  
**Replies:** 1 | **Reads:** 97

[quote="pitrou, post:62, topic:102383"]
The most idiomatic and user-friendly solution for this is to adopt dynamic dispatch rather than ship different packages for different CPU support levels.

[/quote]

Dynamic dispatch cannot solve all the problems users are facing. The specification specifically points to: [manylinux_2_34 x86-64 builds produce binaries that are not compatible with all x86-64 CPUs #1725](https://github.com/pypa/manylinux/issues/1725).

You can use dynamic dispatch when your only concern is a specific inline code focusing on additional extensions. I suppose you could even build the whole library twice with different `-march` values, ship both variants and use dynamic dispatch to switch between them, though it’s going to get really messy.

However, you can’t use dynamic dispatch *not to support* older architectures. The best you can get is failing at runtime.

---

## Post #115 by barry

**Created:** 2025-08-16T16:58:23.015Z  
**Replies:** 0 | **Reads:** 96

[quote="Donald Stufft, post:113, topic:102383, username:dstufft"]
Currently PyPI has a 1GB hard limit on the size of an individual wheel that cannot be raised
[/quote]

I could totally be wrong, and perhaps @EWDurbin can shed light on this, but I think that 1GB hard limit is mostly due to upload request limitations.  With PEP 694 providing a mechanism for indexes to provide alternative upload protocols, it could be possible then to e.g. return [pre-signed S3 URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) to directly upload, in chunks, files up to the [S3 maximum object size](https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html) of 5 TiB.  I'm not saying we *should* just that we *could*.

---

## Post #116 by pitrou

**Created:** 2025-08-16T17:04:15.395Z  
**Replies:** 1 | **Reads:** 96

[quote="Michał Górny, post:114, topic:102383, username:mgorny"]
Dynamic dispatch cannot solve all the problems users are facing. The specification specifically points to: [manylinux_2_34 x86-64 builds produce binaries that are not compatible with all x86-64 CPUs #1725](https://github.com/pypa/manylinux/issues/1725).
[/quote]

This seems to be a red herring. Why would wheel variants be better equipped to solve that problem than standard wheels? If you are able to change the `CFLAGS` for a wheel variant build, then surely you can also change the `CFLAGS` for a standard wheel build?

---

## Post #117 by mgorny

**Created:** 2025-08-16T17:18:53.079Z  
**Replies:** 2 | **Reads:** 95

[quote="pitrou, post:116, topic:102383"]
Why would wheel variants be better equipped to solve that problem than standard wheels?

[/quote]

Because standard wheels cannot express “this wheel can *only* work with `x86_64-v2` whereas variant wheels provide the ability.

[quote="pitrou, post:116, topic:102383"]
If you are able to change the `CFLAGS` for a wheel variant build, then surely you can also change the `CFLAGS` for a standard wheel build?

[/quote]

If you’re using prebuilt static dependencies that are built with `CFLAGS` you have no control over, then no, you can’t. And even if you could, there is no guarantee that you actually *want*; say, if the compiler optimization is actually causing a significant performance gain.

---

## Post #118 by pitrou

**Created:** 2025-08-16T17:41:21.430Z  
**Replies:** 1 | **Reads:** 95

[quote="Michał Górny, post:117, topic:102383, username:mgorny"]
Because standard wheels cannot express “this wheel can *only* work with `x86_64-v2` whereas variant wheels provide the ability.
[/quote]

You are moving the goalposts, aren't you? If your goal is to produce wheels that work on `x86-64-v1` machines, then you are free to do so. Any package author can change the compilation flags for their wheel builds, they don't need a mythical wheel spec change.

What you can't do currently is produce *different* wheels for *different* CPU support levels, but that is an entirely distinct problem from "`manylinux_2_34 x86-64` builds produce binaries that are not compatible with all x86-64 CPUs". Please don't try to masquerade one as the other.

[quote="Michał Górny, post:117, topic:102383, username:mgorny"]
If you’re using prebuilt static dependencies that are built with `CFLAGS` you have no control over, then no, you can’t.
[/quote]

Ok, so wheel variants are not able to solve the problem, either? In the end, what is your point exactly?

---

## Post #119 by oscarbenjamin

**Created:** 2025-08-16T18:07:23.407Z  
**Replies:** 1 | **Reads:** 102

[quote="Michał Górny, post:117, topic:102383, username:mgorny"]
Because standard wheels cannot express “this wheel can *only* work with `x86_64-v2` whereas variant wheels provide the ability.
[/quote]

This is where wheel variants aren't very suitable for CPU architecture levels. It should be possible for all packages to set a minimum CPU architecture level and publish e.g. v2 wheels without needing to have multiple variant wheels or use dynamic installer plugins. In this day and age `x86_64-v2` is a reasonable baseline and it should be fine to use a manylinux image that produces such wheels.

---

## Post #120 by dstufft

**Created:** 2025-08-16T18:08:01.880Z  
**Replies:** 0 | **Reads:** 107

[quote="pitrou, post:118, topic:102383"]
You are moving the goalposts, aren’t you? If your goal is to produce wheels that work on `x86-64-v1` machines, then you are free to do so. Any package author can change the compilation flags for their wheel builds, they don’t need a mythical wheel spec change.

[/quote]

The goal is to produce a binary that works with v2 (for instance) without having an older CPU that doesn’t support v2 select it and attempt to use it.

---

## Post #121 by dstufft

**Created:** 2025-08-16T18:13:24.196Z  
**Replies:** 1 | **Reads:** 103

[quote="oscarbenjamin, post:119, topic:102383"]
This is where wheel variants aren’t very suitable for CPU architecture levels. It should be possible for all packages to set a minimum CPU architecture level and publish e.g. v2 wheels without needing to have multiple variant wheels or use dynamic installer plugins. In this day and age `x86_64-v2` is a reasonable baseline and it should be fine to use a manylinux image that produces such wheels.

[/quote]

Depends on what you mean by possible. 

It’s of course possible to do that now, nothing is stopping you from using v2+ instructions other than people with older CPUs will install it and get hard to diagnose errors. 

Even in a variant future. You’re not required to publish multiple variant wheels, so if you only want a single variant that does v2+ you can do that and use new instructions without causing runtime errors on older CPUs.

---

## Post #122 by oscarbenjamin

**Created:** 2025-08-16T18:40:55.480Z  
**Replies:** 1 | **Reads:** 100

[quote="Donald Stufft, post:121, topic:102383, username:dstufft"]
if you only want a single variant that does v2+ you can do that and use new instructions without causing runtime errors on older CPUs.
[/quote]

You can but if you focus on solving this problem specifically then I don't think that you would want to have the mechanism that is proposed here with dynamic installer plugins. It makes much more sense to have the architecture in the CPU tag of the wheel and for installers to have some hard-coded information about how versioned CPU compatibility works.

The point of the design of the `x86_64-v*` scheme was to produce something simple enough that binary installers could easily do this. The major users of this have been Linux distros and what they have done with it is not publish many variants but rather just bump the whole distro to v2 or later v3 and this is really what should be happening with PyPI as well over time because it isn't sustainable to stick with 25 year old instruction sets forever. The mechanism described here only makes sense for this if you suppose that the vast majority of packages will stay on `x86_64(-v1)` forever but a small number of packages would want to have optional higher variants while also continuing to publish `v1` wheels forever.

---

## Post #123 by pf_moore

**Created:** 2025-08-16T19:48:47.356Z  
**Replies:** 1 | **Reads:** 98

[quote="Michał Górny, post:112, topic:102383, username:mgorny"]
In my opinion, creating an entirely new format for a minor addition like this would be an overkill.
[/quote]

Given the amount of discussion and concern this proposal has triggered in only a few days, I think it's a bit of a stretch to describe it as a "minor addition".

But in any case, I thought the consensus from previous discussions was that the big problem with the wheel format is that even minor additions aren't possible without significant disruption.

---

## Post #124 by dstufft

**Created:** 2025-08-16T20:20:34.212Z  
**Replies:** 0 | **Reads:** 100

[quote="pf_moore, post:123, topic:102383"]
But in any case, I thought the consensus from previous discussions was that the big problem with the wheel format is that even minor additions aren’t possible without significant disruption.

[/quote]

I don’t see any significant disruption required for this change fwiw. Maybe there is other changes that would require disruption I dunno.

---

## Post #125 by rgommers

**Created:** 2025-08-16T20:35:10.299Z  
**Replies:** 2 | **Reads:** 108

[quote="pitrou, post:108, topic:102383"]
I don’t have numbers, but most packages have a relatively small (or even tiny) proportion of dynamically-dispatched code - usually in low-level performance-critical loops.

[/quote]

That really depends on the type of package. For numerical libraries like NumPy, PyTorch, and OpenBLAS there are hundreds of performance-critical functions, not just a few. I can imagine (but have no hard knowledge on this) that for a package with higher-level primitives like Pillow-SIMD, there may be a smaller set of accelerated functions. I do have some numbers, and am happy to consolidate them in the rationale for “why not dynamic dispatch”. To give some rough indication now:

* OpenBLAS: most BLAS and some LAPACK functions have multiple implementations. We took wheel sizes from 9.5 MB to 5.5 MB or so by careful tradeoffs by reducing the number of x86-64 CPU architectures dispatched for from 15 to 5 (see [this issue](https://github.com/MacPython/openblas-libs/issues/144#issuecomment-2058521350)). There’s another 25-40% in wheel size to gain if we could have wheel variants. There is a lot of code to support dynamic dispatch, and >50% of total size came from that.
* NumPy: there’s probably O(100) of the most performance-sensitive functions with SIMD implementations, out of O(1000) total public functions. If I compare a default local wheel build (with optimizations) to one without optimizations (add `-Csetup-args=-Ddisable-optimization=true` to `python -m build`), the wheel size changes from 7.5 MB to 5.5 MB.
* PyTorch: I don’t have exact numbers at hand, but:
  * For CPU code, the SIMD usage is probably a little heavier than NumPy’s
  * For GPU code, the story is completely different. Almost every operator is compiled 8 times or so for different GPU architectures, which matters not only for performance but for supporting the hardware at all - and binary size scales linearly with the number of architectures supported.

So binary size wise, dynamic dispatch is more expensive than you think (and as @dstufft explained, it’s the per-file wheel size that matters, not cumulative size). Then there is implementation complexity. That is probably even more important. It’s incredibly complex to set up dynamic dispatching, since it requires not only CPU feature detection but indirection at the individual function level. This is orders of magnitude more work than simply passing a flag at build time to compile for a different architecture. I’m not exaggerating that - it’s complex enough that projects like SciPy and scikit-learn have looked at it and decided that it was too complex to implement. Only a handful of projects (to my knowledge) like PyTorch, NumPy, OpenCV and Pillow-SIMD actually use it.

tl;dr dynamic dispatch can be valuable, but due to both binary size and complexity/maintainability it can’t reasonably be considered as the only/standard solution.

\*\*\*

As a meta comment: while new ideas are very much valuable and hopefully will lead to a better design with fewer tradeoffs that will be acceptable to everyone, the many folks involved in the wheel variants effort did already explore a bunch of different designs and looked at a lot of the prior art. “Rely on dynamic dispatch” and “use different package names” are two pretty obvious ideas with a good amount of prior art. In addition, there were multiple previous Discourse threads on these topics with hundreds of posts (e.g., [here](https://discuss.python.org/t/implementation-variants-rehashing-and-refocusing/54884), [here](https://discuss.python.org/t/selecting-variant-wheels-according-to-a-semi-static-specification/53446), and [here](https://discuss.python.org/t/what-to-do-about-gpus-and-the-built-distributions-that-support-them/7125)), hence these particular ideas are known. So perhaps it’s more constructive to ask if your favorite solution X was considered and if anyone can share a summary of tradeoffs, rather than just asserting that X is the most obvious, idiomatic, or only solution and starting to argue from that starting point.

---

## Post #126 by willingc

**Created:** 2025-08-16T22:58:18.377Z  
**Replies:** 0 | **Reads:** 99

[quote="rgommers, post:125, topic:102383"]
As a meta comment: while new ideas are very much valuable and hopefully will lead to a better design with fewer tradeoffs that will be acceptable to everyone, the many folks involved in the wheel variants effort did already explore a bunch of different designs and looked at a lot of the prior art.

[/quote]

I’ve scanned a chunk of this conversation. I appreciate the many viewpoints and ideas.

I do think forward steps are essential, and there will undoubtedly be tradeoffs.

As someone who has spent the past decade supporting scientists with real needs for flexible, declarative packaging solutions, I face tradeoffs daily. We spend a large percentage of time supporting cutting-edge medical researchers who have real needs to use a variety of combinations of hardware, OS, and software to do research. As developers, we spend time with matrices of CI combinations to support our open source projects.

I encourage everyone to consider that “good enough” may be the best we can do. I trust that the individuals in this thread can create a “good enough” solution that is better than the “status quo”.

Thanks!

---

This is one example of the complexity that our users face daily:
https://youtu.be/3ObAnSTBri8?si=D-hqGI_fC0cps5b9

---

## Post #127 by ncoghlan

**Created:** 2025-08-16T23:33:45.291Z  
**Replies:** 0 | **Reads:** 98

[quote="Oscar Benjamin, post:122, topic:102383, username:oscarbenjamin"]
The mechanism described here only makes sense for this if you suppose that the vast majority of packages will stay on `x86_64(-v1)` forever but a small number of packages would want to have optional higher variants while also continuing to publish `v1` wheels forever.
[/quote]

The vast majority of extension modules don't do any vector math, and accessing newer vector instructions is a common reason for bumping the target instruction set version, so I actually do assume most packages will be able to stay on v1 of their instruction sets indefinitely.

For the second half, I expect projects that do care to drop the old instruction sets. What I *don't* want us to assume is that all CPU architectures ever will operate solely on a "monotonically increasing instruction set version" model and never on an "optional feature flags model". Even with the CPUs that exist today, it may be desirable to declare that a package requires a feature like AVX512 or a TPM 2.0 compatible security module rather than expressing the vaguer requirement of just a minimum instruction set version.

---

## Post #128 by bwoodsend

**Created:** 2025-08-17T00:52:25.693Z  
**Replies:** 2 | **Reads:** 103

How many variant selectors do we actually need (emphasis on *need* as opposed to *could do with the current design*)?

* One for GPU (driver) selection (I'm assuming the GPU vendors are happy to share)
* One for for micro architecture/instruction availability detection
* There are a few more suggestions listed [here](https://developer.nvidia.com/blog/streamline-cuda-accelerated-python-install-and-packaging-workflows-with-wheel-variants/) but they sound pretty mild/forced to me ^[possibly just be me being naive] and raise questions like how pip is supposed to know what BLAS implementation a user "prefers"

If we can keep the list of allowed variant selectors short and slowly evolving enough that it can just be hard coded into pip, would that be sufficiently far from arbitrary code execution to appease the security concerns?

Even setting security aside, I would prefer to keep the list of allowed variant selectors minimal and still require some kind of community vetting/approval to add a new one. If creating variant selectors was opened up to everyone then I expect our reward will be some new ways that `pip install package==exact.version` can mean who knows what in terms of reproducibility. ^[There would surely be a selector to *optimise* installing packages with interchangeable dependencies by choosing the variant whose dependencies best match what the user already has.
Or possibly one to select between linking against a system library and having the library bundled based on the library's availability on the host.]

I personally don't like the idea of variant selectors being used for anything the user can (easily) change and thereby make an existing environment broken because it now has the wrong variants in it. Strictly speaking, that would include GPU detection since a user can always plug/unplug their GPU but I'll let that one slide on practicality grounds but selecting variants based on availability of system packages/external tools (or really any software), allowing Python environments to break or not make sense anymore whenever a system package manager decides to modify/remove said library/tool, is something I don't ever want to see.

---

## Post #129 by jonathandekhtiar

**Created:** 2025-08-17T01:13:09.000Z  
**Replies:** 3 | **Reads:** 103

It really depends on what you mean by "variant selector" 

If you mean namespace or plugins we are probably talking about 20-30 namespaces depending how the community evolves and settle around these use cases. 

Quick calculation : 1 per hardware vendor (if you want them to maintain their thing they can't share - or the community will need to maintain it and that's very complicated). Even the CPU space, take ARM it's extremely hard to combine everything under one umbrella. Many manufacturers have added "non standard features" - M processors from Apple for instance.

If you are talking about smthg similar to platform tags we are probably talking in 500+ missing values from the current platform tags system and all the detection systems that goes with it. Even if we were to talk about 200 it's still a lot

-------

About hardcoding in PIP / community vetting. The PEP will probably not go there. In the sense we are focused on the technical design. I'm not entirely sure how this kind of governance aspects should be addressed.

In theory I have nothing against it - I'm actually quite opened to it. 

I do really believe the community will take some months / maybe a few years to explore what is possible and sort of converge to solutions.

With this PEP we wanted to focus on the "engineering aspect" which is far from trivial. Find a solution that was technically sound and be able to iterate from there with the community (if that makes sense).

For the comment on BLAS - @mgorny is honestly the right person to answer. Not my domain

---

## Post #130 by oscarbenjamin

**Created:** 2025-08-17T01:58:41.844Z  
**Replies:** 1 | **Reads:** 102

[quote="Jonathan Dekhtiar, post:129, topic:102383, username:jonathandekhtiar"]
If you mean namespace or plugins we are probably talking about 20-30 namespaces depending how the community evolves and settle around these use cases.
[/quote]

Can you try to list these please?

---

## Post #131 by mgorny

**Created:** 2025-08-17T04:41:22.851Z  
**Replies:** 0 | **Reads:** 101

[quote="bwoodsend, post:128, topic:102383"]
* One for GPU (driver) selection (I’m assuming the GPU vendors are happy to share)

[/quote]

I don't really understand what you mean by “sharing“. As long as every GPU vendor has their own “toolkit“, we are going to need one per vendor, since they need to implement that specific API. This means at least AMD, NVIDIA and Intel. I'm assuming here we don't care about older stuff like OpenCL, and that new driver API doesn't emerge that's going to require a new lookup. And of course, that the driver provides a clean API that returns values that can account for future variants (i.e. new GPUs).

Other kinds of accelerator hardware will probably need per-vendor logic too.

[quote="bwoodsend, post:128, topic:102383"]
* One for for micro architecture/instruction availability detection

[/quote]

Again, we're talking about one per vendor, and it's even more complex here, since outside of x86, the actual API is platform dependent, so we'd actually need a separate mapping from “lookup“ to variant properties.

Since some CPUs have hundreds of “features“, we'd either have a humongous mapping that we update with new CPUs, or a selective mapping that we update when packages need new properties.

Plus, things like `x86_64-v3`aren't really defined at CPU level, so we'd need to actually maintain mapping from CPU instruction sets to specific architecture levels.

---

## Post #132 by jonathandekhtiar

**Created:** 2025-08-17T05:41:19.349Z  
**Replies:** 2 | **Reads:** 97

I'll do my best ... But just with AI accelerators we are getting probably close to 10.

Then X86_64 as @mgorny highlights it is +/- uniform, but it's not **at all** the case for `ARM` and some packages may want to optimize for a given ARM vendor (Apple M processors - it's wide spread and worth it). So let's say the TOP 5 ARM vendors will want their own logic and provide optimize compute packages for their ecosystem.

Good we're already at 15.

At PyCon25, one recurring reason people reached out about variant was robotic, I had many robotics engineers / researchers asking how they can use variants to support custom arch (right now they fork `packaging` and `pip` to inject a new platform tag. More niche, but definitely a cool use case variants will help to address. I would personally put `FPGA / ASIC` in the same box, more niche but definitely useful to be able to support. Not sure if we could call them "mainstream usecases though"

Then you could add "networking tech": Infiniband, ethernet (RoCE), etc.

You can add Storage Fabric (I won't pretend I know enough about this)

And all kind of "system library dependencies" : OpenMP / MPI / BLAS ... Again @mgorny can speak more about these usecases.

---------------------

One of the core assumption / design intents of this work was to create a system that allow **any** usecase to organically emerge and be addressable. Platform tags are "failing" to address the scientific compute needs because they are a "white listed of stuff", it's slow moving, people would argue against adding anything to it. Doesn't work well.

We thought about adding code for the "provider logic" directly into `pip` or `PyPA` but then ... Who's gonna review the PRs ? Under what timeline ? I think it's unreasonable (from us) to ask the community to take on the extra burden of review / maintenance. And that's why we didn't do it.

Now - if we decide the following:
- Providers are by default "opt in" not "opt-out"
- Providers that reach a certain level of adoption within the community (could be adoption by one major package for instance), get to be elevated as part of `PyPA` or something else and vendored into installers or "auto install == opt-out mode".

That's very reasonable to me ...  

There are definitely "higher priority use cases" and "lower priority use cases" for the vast majority of python users. I do believe it's reasonably simple to provide a good user experience for let's say >90% of people. And we should not let "better" become the enemy of "good" if that makes sense.

So in a sense - I do agree with you in principle - maybe the execution would need some refinement (which it always does).

Now - this direction was to emerge as a community - it would definitely seem to need to fork into 2 PEPs - one technical (how it works) and one "informational PEP" / governance style.

---

## Post #133 by ncoghlan

**Created:** 2025-08-17T06:07:13.133Z  
**Replies:** 0 | **Reads:** 95

[quote="Jonathan Dekhtiar, post:132, topic:102383, username:jonathandekhtiar"]
Now - if we decide the following:

* Providers are by default “opt in” not “opt-out”
* Providers that reach a certain level of adoption within the community (could be adoption by one major package for instance), get to be elevated as part of `PyPA` or something else and vendored into installers or “auto install == opt-out mode”.

That’s very reasonable to me …
[/quote]

This also has the virtue of building in a graceful evolution mechanism from the start, and allows installation tools and environment providers (whether that's `pip`, `uv`, `pdm`, `hatch`, `pipenv`, `conda`, Linux distros, notebook hosting providers, etc) to make their own decisions on which variant selectors (if any) to enable by default.

At the PEP level, variant selectors would formally be opt in with a "MAY" clause granting the flexibility to installers to decide to make pre-approved selectors opt-out (recognising that doing so is de facto making that selector part of the installer from a security perspective).

---

## Post #134 by rgommers

**Created:** 2025-08-17T07:22:36.823Z  
**Replies:** 0 | **Reads:** 99

[quote="jonathandekhtiar, post:129, topic:102383"]
1 per hardware vendor (if you want them to maintain their thing they can’t share - or the community will need to maintain it and that’s very complicated). Even the CPU space, take ARM it’s extremely hard to combine everything under one umbrella

[/quote]

It’s probably not obvious at first why it doesn’t work well to assume that hardware vendors can share infrastructure/packages, so beyond the technical differences that can make sharing an awkward fit, I’d like to share a couple of real-world experiences with this:

1. Legal constraints: both CPU and accelerator hardware vendors operate in a space with a few very large and maybe O(10) relevant smaller vendors, large economic impact, and IP and anti-competitive behavior lawsuits being a real concern. I’ve seen situations where engineers from hardware vendors were literally forbidden from being in the same meeting to talk about an open source project/idea without getting internal approval first (which can be painful to obtain).
2. Vendor neutrality: in NumPy development we did receive a complaint from a vendor about why we did have x86-64 SIMD code in-tree but were not accepting equivalent code for other CPU types. The rationale was maintainability and we made clear at that point that we were an open source project with limited resources, and we were not obliged to do anything. At that point the vendor did contribute funding and some engineering time to help change the equation - which was one of the reasons we accepted and spent time on making things more generic (xref [NEP 38 - Using SIMD optimization instructions for performance](https://numpy.org/neps/nep-0038-SIMD-optimizations.html)) An open source project clearly can decide whatever it wants through its own governance processes, but vendor neutrality does seem quite a bit more fair, and the larger a project is, the more that is likely to matter.
3. Organizational: separation of responsibilities. Again a NumPy example. We had cases where Apple contributed Arm-specific optimizations (see [these PRs](https://github.com/numpy/numpy/pulls?q=is%253Apr+author%253ADeveloper-Ecosystem-Engineering+is%253Aclosed)). As maintainers had clear requests for what we wanted to see, primarily clear benchmark results to show that the extra code was worth adding / worth our review time and a good maintainability/performance tradeoff. So far so good, until the optimization work had to touch generic code. At that point we had to see benchmarks also for x86-64 and even PowerPC, and it was complex to get that done which is understandable: it’s hard for an engineer from a vendor to tell their manager that they’re risking introducing regressions for the competion (back to legal risk) or are spending time optimizing code specific to another vendor (“are we paying to help our competitor here?”). 

Things work way better when concerns are separated and everyone can play in their own sandbox.

---

## Post #135 by pitrou

**Created:** 2025-08-17T07:55:53.001Z  
**Replies:** 2 | **Reads:** 97

[quote="Ralf Gommers, post:125, topic:102383, username:rgommers"]
tl;dr dynamic dispatch can be valuable, but due to both binary size and complexity/maintainability it can’t reasonably be considered as the only/standard solution.
[/quote]

I'll just point here that if you produce ^[or let other people produce] any other binary packages than just wheels (for example conda packages, Debian/Ubuntu packages, etc.), you may want to implement dynamic dispatch anyway so that users of these packages also benefit from appropriate CPU optimizations.

---

## Post #136 by pitrou

**Created:** 2025-08-17T08:12:38.516Z  
**Replies:** 1 | **Reads:** 96

[quote="Jonathan Dekhtiar, post:132, topic:102383, username:jonathandekhtiar"]
So let’s say the TOP 5 ARM vendors will want their own logic and provide optimize compute packages for their ecosystem.
[/quote]

Would they? To me, it seems you're overestimating the need and underestimating the work of maintaining separate, "optimized" builds (or even forks) of popular open source packages.

It's relatively easy to produce a separate build as a one-shot endeavor, put it on the Internet and then look elsewhere as you consider the thing "done". It's harder to track upstream changes in the long run, incorporate them, validate the whole thing (including continuous benchmarking, since you're motivated by performance) and handle user tickets/support requests.

---

## Post #137 by bwoodsend

**Created:** 2025-08-17T08:26:25.057Z  
**Replies:** 0 | **Reads:** 94

[quote="Jonathan Dekhtiar, post:129, topic:102383, username:jonathandekhtiar"]
It really depends on what you mean by “variant selector”
[/quote]

I mean distinct PyPI packages that need to be executed at resolve time. I'd want the list of such packages to remain a humanly auditable number. But [Ralph's comment](https://discuss.python.org/t/wheelnext-wheel-variants-an-update-and-a-request-for-feedback/102383/134) makes it clear we can't have that which leaves me a lot more -1 on this whole thing than I was yesterday.

---

## Post #138 by h-vetinari

**Created:** 2025-08-17T08:52:06.255Z  
**Replies:** 1 | **Reads:** 95

[quote="pitrou, post:135, topic:102383"]
I’ll just point here that if you produce any other binary packages than just wheels (for example conda packages, Debian/Ubuntu packages, etc.), you may want to implement dynamic dispatch anyway so that users of these packages also benefit from appropriate CPU optimizations.

[/quote]

conda/mamba/pixi can deal with variants, including nowadays x64 CPU generations (not saying that’s the case for all package managers, of course). The experience is not entirely great because (like filenames for wheels), we end up [overloading](https://github.com/conda/conda/issues/11053) build strings with too many things for users to be able to select them easily. On the other hands, this kind of granular control is often not necessary, as conda’s virtual package detection (+/- equivalent to plugins here) can take part in the resolution process, and choose the right variant without user input.

In other words, we [encourage](https://github.com/conda-forge/pytorch-cpu-feedstock/issues/155) users (and other recipes!) to depend on the generic packages (e.g. `pytorch`), rather than manually depending on `pytorch-gpu` or `pytorch =*=cuda126*`, because the latter ones are needlessly restrictive and incompatible with other users.

With several years of experience of this sort of thing in conda-forge, I consider it desirable to keep package dependency specification as variant-free as possible, except for the project determining the operations/prioritization of its own variants of course, or – where necessary – where it depends on precise variants of other packages (e.g. CUDA-enabled `torchvision` requires CUDA-enabled `pytorch`).

In that vein, despite the overall sentiment in this thread about code execution so far, it’s IMO the right trade-off to determine system capabilities upon installation invocation, and make variant decisions based on that. It’s worth noting though that this is really not *arbitrary* code execution, but rather very specific code that interrogates the system. These plugins can be audited, allowlisted, etc.; whatever’s necessary to achieve the relevant security posture.

---

## Post #139 by rgommers

**Created:** 2025-08-17T09:05:54.609Z  
**Replies:** 3 | **Reads:** 99

[quote="pitrou, post:135, topic:102383"]
if you produce any other binary packages than just wheels (for example conda packages, Debian/Ubuntu packages, etc.), you may want to implement dynamic dispatch anyway

[/quote]

Sure that can be beneficial if you have a ton of engineering expertise and bandwidth to invest, but note that many of these ecosystems already have a mechanism similar to what wheel variants would offer:

* \~Debian-based distros have had `multiarch`( https://wiki.debian.org/Multiarch/HOWTO ) support for a long time, and other Linux distros have similar mechanisms.\~ EDIT: see [this comment further down](https://discuss.python.org/t/wheelnext-wheel-variants-an-update-and-a-request-for-feedback/102383/165) for how Linux distros are moving `glibc-hwcaps` for package-level support. 
* Conda-forge has `microarch_level` support (this is fairly recent): https://conda-forge.org/docs/maintainer/knowledge_base/#microarch
* Spack has very fine-grained support for CPU and GPU architectures built-in: https://spack.readthedocs.io/en/latest/package_fundamentals.html#support-for-specific-microarchitectures

It’s just not one or the other, both have their place.

[quote="pitrou, post:136, topic:102383"]
To me, it seems you’re overestimating the need and underestimating the work of maintaining separate, “optimized” builds (or even forks) of popular open source packages.

[/quote]

I would indeed not expect to have five Arm flavors on PyPI, really just one for a long time, and very maybe a second more niche one for the cases where macOS arm64 and Linux aarch64 differ.

That said, there *is* a long tail of use cases where more specific optimized builds and forks do happen, not everything has to be on PyPI for it to be relevant. The robotics example @jonathandekhtiar gave is an example of that: may not end up on PyPI for general-purpose OSS packages, but it is relevant enough for that subcommunity that they did create the optimized builds and forked `packaging`/`pip` to make that happen - enabling that more naturally has value. Another example for Arm is Fujitsu’s [Fukagu supercomputer](https://en.wikipedia.org/wiki/Fujitsu_A64FX): it has its own compiler and instruction sets, and while that all happens away from PyPI, I do semi-regularly see patches for it across build systems and packages like `numpy`. I haven’t directly asked them, but I’m reasonably sure that a way to support their A64FX CPU through a plugin so that they can distinguish between their own optimized builds and generic `aarch64` packages will be helpful. And note: the patches typically aren’t from “large-company engineer solving for corporate needs only” but from scientists who care about being able to use the hardware they have available to them optimally.

That principle of the long tail of use cases holds elsewhere as well. For example, we’re working with Red Hat engineers who are packaging for Red Hat AI, which supports [accelerators from NVIDIA, AMD, and Intel](https://docs.redhat.com/en/documentation/red_hat_openshift_ai_self-managed/2.19/html/working_with_accelerators/overview-of-accelerators_accelerators), and ships Python packages as wheels. Builds for each of those accelerator types for, say, PyTorch  on Python 3.13 now all end up named `torch-2.8.0-cp313-cp313t-manylinux_2_28_x86_64.whl` - so they have N builds with identical wheel names that then have to be maintained in separate index servers. This is way harder to work with then if they’d have `torch-…-cuda128`, `torch-…-rocm64`, etc. in a single index server.

The way the wheel variants design works currently - static enough to make, e.g., universal resolution across platforms like `uv` et al need, but flexible enough that hardware and build config support can be extended without needing a PEP and/or packaging tool update for every single extension - aims to strike a balance between solving common real-world needs, usability, packaging tool author needs, and more niche real-world needs. When you argue about questions like “how many Arm CPU flavors are useful”, it’s useful to keep that in mind - you’re both partially right, it’s just that you’re thinking about different parts of this spectrum of needs.

---

## Post #140 by mgorny

**Created:** 2025-08-17T15:26:34.543Z  
**Replies:** 0 | **Reads:** 93

[quote="pf_moore, post:92, topic:102383"]
I think it would be much easier to have this discussion if the proposal was carefully neutral over how selector plugins get executed. For now, omit all discussion of *how* the consumer knows whether the target environment supports selector XYZ, and concentrate on how the right wheel will be picked assuming the answer is known. This is very much like the existing wheel tags - the spec describes how a wheel is selected based on tags, but says nothinng about how tools know what tags the environment supports.

[/quote]

Thinking about it, it makes sense to me. For the purpose of prototyping, it made sense to have a complete solution to test and evaluate, but I suppose that for final specification we can split into two or more PEPs.

One point that the current prototype doesn’t account for is the possibility of having package-defined variants that are oriented towards explicit user selection, and don’t really need plugins at all. The initial example for this would be NumPy’s BLAS/LAPACK variants, where the user may wish to select between NumPy built against OpenBLAS or mkl, but there is no explicit “algorithm” to prefer one over another.

So technically we could split into something like:

1. Generic “wheel variants” idea that lets maintainers create wheels marked with specific variant properties, and users to select between them explicitly.
2. One or more specific PEPs that focus on adding automatic variant choice.

Off the tip of my finger, this could introduce some issues that we need to consider, such as:

* How do verify variant property values for validity? The plugin system right now also serves the purpose of verifying that you don’t use invalid variant property values. If “providers” become optional, we are technically facing the risk of creating wheels that will diverge from the second PEP and therefore won’t work correctly with the automation.
* How do we handle different preferences between “non-automated” and “automated” installs? Say, right now automation prefers the highest CUDA version for PyTorch if it is supported — but if we can’t check that, we’d probably want to have a more conservative default.

---

## Post #141 by mgorny

**Created:** 2025-08-17T15:37:20.956Z  
**Replies:** 0 | **Reads:** 94

[quote="rgommers, post:139, topic:102383"]
Sure that can be beneficial if you have a ton of engineering expertise and bandwidth to invest, but note that many of these ecosystems already have a mechanism similar to what wheel variants would offer:

[/quote]

The closest equivalent in Gentoo are USE flags. Besides controlling package features, USE flags have some overlap with the intended use case for variants, such as CPU instruction sets.

In Gentoo, the flag choice is entirely manual, with some “reasonable” defaults provided at distribution level. Say, if you don’t set `CPU_FLAGS_X86`, packages using explicit SIMD code would be limited to SSE2 on amd64, or SSE on i686. We provide a tool, [cpuid2cpuflags](https://github.com/projg2/cpuid2cpuflags/) that users can use to detect their CPU features and set a good value.

At this moment, it supports ARM, PowerPC and x86, and the logic is already quite complex. Mind you, it only needs to support Linux. When packages start needing new CPU-related flags, we need to update it in lockstep with the distribution flag definitions, to ensure that flag names match. And of course, it happened more than once that developers added new flags without actually pinging me to update the tool.

Another problem with that approach is that since the tool needs to be run manually, people don’t realize that they need to run it again after an update, so they end up running their systems with incomplete flag sets.

And let’s not forget that Gentoo is what you’d call an “harder than average” distro. Aiming for more general population of PyPI users means that we need to aim for a simpler solution.

---

## Post #142 by pitrou

**Created:** 2025-08-17T16:37:23.816Z  
**Replies:** 2 | **Reads:** 91

[quote="Ralf Gommers, post:139, topic:102383, username:rgommers"]
* Debian-based distros have had `multiarch`( [Multiarch/HOWTO - Debian Wiki](https://wiki.debian.org/Multiarch/HOWTO) ) support for a long time, and other Linux distros have similar mechanisms.
[/quote]

Ok, but what does this have to do with SIMD support levels? Here on Ubuntu 24.04:
```console
$ dpkg --print-architecture
amd64
```

[quote]
* Conda-forge has `microarch_level` support (this is fairly recent): [Knowledge Base | conda-forge | community-driven packaging for conda](https://conda-forge.org/docs/maintainer/knowledge_base/#microarch)
[/quote]

Ok, also of note in that page:
> Preferably, the project should rely on runtime dispatch for arch-specific optimizations.

---

## Post #143 by jamestwebber

**Created:** 2025-08-17T16:40:43.551Z  
**Replies:** 1 | **Reads:** 90

[quote="h-vetinari, post:138, topic:102383"]
It’s worth noting though that this is really not *arbitrary* code execution, but rather very specific code that interrogates the system. These plugins can be audited, allowlisted, etc.; whatever’s necessary to achieve the relevant security posture.

[/quote]

I think this is only possible if the plugins are in some kind of controlled registry, *or* it’s an opt-in choice to download a plugin^[so the auditor can inspect it before making that choice, or set up their own plugin repository, or whatever they want].

The way the original proposal was phrased, it seemed like `pip install foo` would automatically download whatever plugin `foo` asked for and then run it, no questions asked. An open index like PyPI^[or even worse, something like GitHub] doesn’t have the security resources to stop malicious plugins from sneaking in, even if only for a brief time window.

---

## Post #144 by pf_moore

**Created:** 2025-08-17T16:56:34.068Z  
**Replies:** 1 | **Reads:** 93

Taking a step back, are there any good examples of prior art in this area? It sounds like this is very much a universal issue, not closely tied to Python, so I don't think we should be innovating here, but rather we should build on what others haved already done.

In particular, are there other package management systems that download and run package selection code at install time? How do those systems ensure that the selection code is autitable and controllable? Do they have a curated package repository (somnething that Python doesn't have, one specific concern I have here is how much reliance this might put on PyPI not hosting malicious code).

@jonathandekhtiar claimed there could be 20-30 selector namespaces. Are there any examples of other package management systems that allow packages to be defined to that level of granularity? Being able to control 20-30 different variables when differentiating packages seems *incredibly* unmanageable (even if "most" packages only use a few of that number) and I'd like to know how other package managers handle that.

---

## Post #145 by AA-Turner

**Created:** 2025-08-17T17:40:15.441Z  
**Replies:** 1 | **Reads:** 91

Is there an allegory to platform triples with variant namespaces? From reading the above, it seems the current suggestion is that each vendor (eg ARM, NVIDIA, etc for GPUs) would have their own dedicated namespace. Could we instead express this as `gpu_api`? For CPUs, we have far more variety but a standard way of expressing this, without new namespaces for Intel, ARM, AMD, RISC, etc.

I might be misunderstanding things, or this might’ve been considered and rejected already, but I’m not sure I understand why the number of variant axes is so high — I had naïvely expected eg GPU API version, BLAS type, perhaps supported chipset instructions — single digit ‘namespaces’, but each with many different possible properties that a resolution algorithm could match up.

A

---

## Post #146 by jonathandekhtiar

**Created:** 2025-08-17T17:48:05.497Z  
**Replies:** 6 | **Reads:** 98

Yes there are MANY examples of prior art.

If you want to look in the python world - conda virtual packages are one of the reasons people adopted conda forge in the scientific compute space.

Spack was another attempt taking everything on the opposite side (what if we just rebuild everything at install time) with compiler flags "local specific".

Docker had to implement a similar concept https://docs.docker.com/build/building/multi-platform/ because "just containers tags" was absolutely not enough. And ironically this is smthg that became really critical when Apple switched to ARM processors. Over night so many containers had to be rebuilt in "multi platform mode" (apple including x86 emulation immensely helped to smooth the transition).

We will be including an entire section on prior art inside the PEP. We took a lot of inspiration in the design in how these systems work and how we can best adapt them to the "python ecosystem". No need to reinvent the wheel (or maybe we shall 😜)

------

What other package managers have done is including that code / vendoring it inside the installers.

We always assumed pip maintainers would be firmly opposed to that idea. Maybe we are wrong about that.

For many reasons:
- increase the maintenance load on the installer side 
- Getting github issues on code you didn't write / don't really know how to fix (I have no idea how to maintain FPGA related code - I would assume so as most people).
- Deciding how to place the bar "what should be or should not be included inside the installer" can create real tensions.

So all of these points considered we always assume it was better to just "build smthg separately". Now if we wanted to build an allow list of "approved plugins" or vendor them inside installers.

1. I don't think the PEP needs to go on that ground. The PEP is defined around the technical "mechanism". Installers can totally have freedom of design in how they deal with them. I wouldn't be surprised different installers take different strategies.
2. If we really want to go on the "governance ground" in the PEP. I would prefer to split up in two as you and @barry suggested a little before.

---

## Post #147 by notatallshaw

**Created:** 2025-08-17T17:50:28.844Z  
**Replies:** 1 | **Reads:** 95

I would just like to remind everyone that we should be taking everyone's posts in good faith. 

That people have real concerns about how this interacts with existing expectations and the complexity of this solution.

And that people haven't put all this effort into developing this propsal and prototyping it to solve a none issue or are just ignoring existing solutions. 

The worst outcome for me would that this creates a split, where variants could be hosted on alternative indexes to solve real problems customers might have, but then standard tools can't interact with those variants.

It might make sense to wrap up the existing discussions soon so that the propoants have time to think about and integrate feedback, rather than expecting them to defend all details continuously across dozens and dozens of posts in a short time frame.

---

## Post #148 by mikeshardmind

**Created:** 2025-08-17T17:51:13.087Z  
**Replies:** 1 | **Reads:** 95

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
Getting github issues on code you didn’t write / don’t really know how to fix (I have no idea how to maintain FPGA related code - I would assume so as most people).
[/quote]

At what level of hardware feature complexity should we just tell users "build from source if you need the most optimal option?"

This is a serioius question, this many axes, should people insist they really are needed, will result in nearly impossible to humanly audit and test build outputs

---

## Post #149 by ncoghlan

**Created:** 2025-08-17T17:55:57.990Z  
**Replies:** 1 | **Reads:** 93

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
Getting github issues on code you didn’t write / don’t really know how to fix (I have no idea how to maintain FPGA related code - I would assume so as most people).
[/quote]

Note that this problem exists regardless of whether it's due to vendoring *or* dynamic plugins (since it is the wrapping installer that reports the runtime error either way).

At least with vendoring, the installer authors *know* which of their selector plugins have been updated recently.

---

## Post #150 by jonathandekhtiar

**Created:** 2025-08-17T17:59:27.033Z  
**Replies:** 2 | **Reads:** 93

I believe it's an artifact of the design. If you design plugins to be independent from each other. (Which as @rgommers pointed out... You pretty much have to at least for legal reasons). Well the only way to guarantee no name clash is the namespace :: name :: value design.


[quote="Michael H, post:148, topic:102383, username:mikeshardmind"]
At what level of hardware feature complexity should we just tell users “build from source if you need the most optimal option?”
[/quote]


This is very much what Spack is for. And exactly why people have adopted it.

I personally believe the PEP should give tools for people to do what they need and try to avoid - when possible - to tell them what to do. Because ultimately these limits are artificial. If anything, our prototype proves it's technical possible to really support any wild idea people may have (though doesn't mean it should be supported - but we do need a good reason to actively stop it).

I do like the concept of "allow listing" the most "prominent use cases" as they grow and they become "prominent". I sincerely believe variants will open doors and use cases we can not foresee today and having a design that can evolve and adopt these new use cases as they grow is a really strong argument in favor of the design (or smthg similar) we currently have.

I really think we (WheelNext) collectively wanted to avoid a proposal that would increase the maintenance burden on installers or organizations like PyPA / maybe-soon-to-adopted packaging Council. Now honestly, if the community believes it's the way forward, then so be it 👌

[quote="Alyssa Coghlan, post:149, topic:102383, username:ncoghlan"]
At least with vendoring, the installer authors *know* which of their selector plugins have been updated recently.
[/quote]

Very fair point. I think it was more a question of respect for us to not propose a design that increase the work for someone else. But rather let them offer that option themselves if that's something they prefer. I'm not sure I would have personally much appreciated if someone was to propose smthg and tell me "because of my proposal you have to do X much more now". I'd have much more appreciated being the person fronting the idea - if that's something that matters to me

---

## Post #151 by jonathandekhtiar

**Created:** 2025-08-17T18:11:50.982Z  
**Replies:** 0 | **Reads:** 91

Sorry for the repeating posts - I'm on my phone really hard to reply to multiple people in one go.

[quote="Damian Shaw, post:147, topic:102383, username:notatallshaw"]
It might make sense to wrap up the existing discussions soon so that the propoants have time to think about and integrate feedback, rather than expecting them to defend all details continuously across dozens and dozens of posts in a short time frame.
[/quote]

First of all, thank you Damian. On a personal level I sincerely appreciate your message and participation in this thread.

I will be trying to produce a summary of the different points made in this thread - if anything for purely selfish reasons (but not only) - it helps immensely to write a PEP that already start providing some answers to the concerns highlighted here.

And yes at some point we will need to focus on the actual PEP which is reasonably hard to do when DPO is at full speed, though to be honest, I consider this discussion we are having an essential step to understand what the community is worried about and how we can do a fair and best attempt to address these concerns

This PEP will have without any doubt many many iterations. So it's a matter of finalizing a first draft that we can push on github and start refining over time.

I'm even willing to organize a live "Q&A" or "Recorded session where we go over the PEP and highlights the key points". I do believe it will help people to have a way to quickly ramp up on the topic without reading a very long document. Let us know what will help - and we'll try to make it happen.

---

## Post #152 by mgorny

**Created:** 2025-08-17T18:43:08.032Z  
**Replies:** 0 | **Reads:** 91

[quote="jonathandekhtiar, post:150, topic:102383"]
I do like the concept of “allow listing” the most “prominent use cases” as they grow and they become “prominent”.

[/quote]

For the record, I don’t think there’s that much technical difference between “allowlisting” plugins and expecting installers to deal with automation. In the end, I don’t think installer authors would be writing all the logic themselves (except perhaps for the most common / easily available use cases), but rather relying on third-party code to supply that logic. So what we’re effectively talking about is the difference between each installer vendor separately auditing all the libraries needing to implement the logic vs. having a central body that audits provider plugins.

---

## Post #153 by sirosen

**Created:** 2025-08-17T19:01:25.901Z  
**Replies:** 3 | **Reads:** 97

Selectors seem reminiscent of build backends. Which is a system which works pretty well, but has some points of friction which I'd like the PEP authors to think about. Most particularly, you don't control what version of a build backend a consumer may use, so new build backend versions can break things (Cython 3.0 comes to mind), and trying to specify reproducible installs requires pinning.

I'm therefore interested in the way that build backends may be unpinned in metadata, but then pinned to specific versions for install reproducibility via `PIP_CONSTRAINT`.

How are selector plugins expected to evolve and change over time, if they are packages?
Are selectors expected to execute in an isolated environment? Will we expect a `--no-build-isolation` option for this for installers?

The security considerations are partially addressed if it is at least possible to constrain the "selection environment".

---

Looking at `pip-compile`, there are options for extracting the build dependencies for exactly these sorts of needs. I would expect to need similar options to extract selector plugins packages.

---

## Post #154 by jonathandekhtiar

**Created:** 2025-08-17T19:34:42.879Z  
**Replies:** 0 | **Reads:** 97

It goes beyond being "reminiscent" of build backends ... We purposefully decided to adopt as many design intents and cues from the build backend design and API - specifically because it's already a design that was approved by the community and something people are used to.

```
[variant.default-priorities]
namespace = ["custom_namespace"]

[variant.providers.custom_namespace]
requires = ["package-name>=0.0.1,<1.0.0"]
plugin-api = "package_name.module:PluginCls"
```

We even took inspiration on how `build isolation` is working :slight_smile: 

So if anything - I'm glad it "feels reminiscent" because that's very much a purposeful intent.

---

## Post #155 by notatallshaw

**Created:** 2025-08-17T19:40:28.901Z  
**Replies:** 1 | **Reads:** 98

[quote="sirosen, post:153, topic:102383"]
I’m therefore interested the way that build backends may be unpinned in metadata, but then pinned to specific versions for install reproducibility via `PIP_CONSTRAINT`.

[/quote]

I think a standard approach to pinning should be via lock files, though the standard lock file still needs to be extended to build backends.

The exact UX of constraints should likely be left up to the tools, for example pip is likely to decouple install time and build time constraints soon: https://github.com/pypa/pip/pull/13534. I would imagine if this propsal passed as is it would make sense to add an additional variant constraints.

---

## Post #156 by sirosen

**Created:** 2025-08-17T19:49:13.214Z  
**Replies:** 0 | **Reads:** 99

Yes, I agree with all that has been said about the spec not dictating the implementation. But the proposal itself should have some notion of how tools *might* handle the situation.

Regarding locks, a multi-environment lock could hold many variants, so the selector would be needed at install time. Controlling which version of the selector gets used determines whether or not the lock really results in a reproducible install.

And multiple packages in such a lock could have conflicting requirements for their selectors. I think there's some nontrivial gap in the current DX around build backends. Doubling down on it is actually *fine*, IMO -- the spec doesn't have to solve everything -- but I'd like people to look at these problems and at least think through what happens when PIP_CONSTRAINT becomes a de-facto standard way to pin build backends _and_ selectors.

---

## Post #157 by pf_moore

**Created:** 2025-08-17T21:38:22.700Z  
**Replies:** 6 | **Reads:** 102

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
If you want to look in the python world - conda virtual packages are one of the reasons people adopted conda forge in the scientific compute space.
[/quote]

I know very little about conda. Could you give me a pointer to some sort of example that shows how conda handles the sort of "20-30 different namespaces" problem that you referred to here?

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
Spack was another attempt taking everything on the opposite side (what if we just rebuild everything at install time) with compiler flags “local specific”.
[/quote]

Isn't that precisely the opposite of this proposal - they explicitly avoid dealing with binary distribution, so they don't have the problems we're trying to solve here?

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
Docker had to implement a similar concept [Multi-platform | Docker Docs](https://docs.docker.com/build/building/multi-platform/) because “just containers tags” was absolutely not enough.
[/quote]

From a *very* quick read of that document, it looks much more like the "fat wheel"/"dynamic dispatch" approach that @pitrou was suggesting (which the wheel variant people seem to disagree with).

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
We will be including an entire section on prior art inside the PEP.
[/quote]

Awesome - I look forward to seeing it (and sorry if the above felt like a point-by-point rebuttal of the examples you gave, I'm genuinely glad to know this has been thought about, and I'll be glad to have the gaps in *my* knowledge around prior art filled :slightly_smiling_face:). In the interests of keeping things a manageable size, I'd recommend focusing mainly on prior art that implements solutions *similar* to what you're proposing (dynamic selector plugins invoked at runtime to choose which binary artifact to download and install) - those would be much more helpful (IMO) than examples that demonstrate alternative approaches which wouldn't suit Python^[Which is what the list you posted above felt like, if I'm honest].

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
We always assumed pip maintainers would be firmly opposed to that idea. Maybe we are wrong about that.
[/quote]

Speaking personally, I'd be against including the code (in the sense of being responsible for it ourselves) but vendoring is much more plausible.

Your points all apply, but if I'm trading them off against the risks and problems around adding a mechanism whereby pip downloads and installs plugins on demand, based on package metadata, then I'd be willing to consider vendoring.

There would be some concerns, of course:

1. How much would this increase the size of the pip wheel (both in bytes, and in "number of vendored dependencies")? You were talking 20-30 possible variables - Adding 20-30 new vendored dependencies to pip is a *lot*.
2. The libraries would need to conform to pip's vendoring requirements (most critically, only pure Python code is allowed).

We could avoid these issues, at the cost of a less user friendly approach, by requiring selectors to be 3rd party packages, and expecting the user to install any needed selectors before running pip.

[quote="Jonathan Dekhtiar, post:146, topic:102383, username:jonathandekhtiar"]
I don’t think the PEP needs to go on that ground. The PEP is defined around the technical “mechanism”. Installers can totally have freedom of design in how they deal with them. I wouldn’t be surprised different installers take different strategies.
[/quote]

I'd like to believe that, but in practice I think it's going to be impossible to avoid a pressure for installers to implement some level of "minimum expected" behaviour. And I think that's entirely reasonable. Therefore, not saying what that "minimum expectation" is, simply pushes the responsibility onto installer maintainers to make that judgement - and you've already made the point that installer maintainers don't have the expertise necessary to make informed choices in this area (a statement that I agree with!)

To be specific, on a purely personal basis, I don't understand why all of this is such a big deal. I've never found the current state of affairs with numpy/scipy and BLAS to be a problem, and while I've not used torch or any of the other GPU-intensive libraries, I feel that if I did, needing to point pip at the correct index to pick up the libraries that are optimised for my system wouldn't be *that* much of an ask. So for me, as a user and as a pip maintainer, I'd be inclined to do the bare minimum to support wheel variants. And in the absence of a standard that says "this is the absolute minimum needed to provide a good user experience for a broad range of users, and installers must implement at least this level of functionality" I'd push back hard on any PRs that added significant extra complexity to pip in order to support extra wheel variant functionality.

I don't think that is where we want to be - I think the proposal *should* require specific designs from installers. I'm not talking about UI (command line flags, defaults, etc.) but I do mean everything else - should selectors be downloaded and invoked dynamically, or should they be static based on a fixed whitelist? Should the user pre-generate a "selector values" metadata file for the environment, or should installers generate this on demand?

I'm happy for the PEPs to be split up into "technical mechanism" and "installer features", but I'm not comfortable with the latter being merely advisory or informational. Apart from anything else, users have a right to know what they can expect from standards-compliant installers, without having to research every tool individually.

---

## Post #158 by h-vetinari

**Created:** 2025-08-17T23:45:06.663Z  
**Replies:** 2 | **Reads:** 102

[quote="pf_moore, post:157, topic:102383"]
[quote="jonathandekhtiar, post:146, topic:102383"]
If you want to look in the python world - conda virtual packages are one of the reasons people adopted conda forge in the scientific compute space.

[/quote]

I know very little about conda. Could you give me a pointer to some sort of example that shows how conda handles the sort of “20-30 different namespaces” problem that you referred to here?

[/quote]

Here’s some [context](https://github.com/conda/ceps/pull/103) about virtual packages work in conda-land^[though it isn’t merged, it describes the situation very well, including e.g. how to override things where necessary. It’s a specification after the fact, in the sense that this is implemented in all conda clients and in heavy use throughout our ecosystem.]. The situation is simpler because it’s a single tool^[counting conda, mamba and pixi as one for argument’s sake; they all do the same] for a single ecosystem, and those detection capabilities are vendored into conda itself. In turn, conda doesn’t cover nor distinguish the full set of 20-30 different dimensions that would conceivably become necessary if this is solved through plugins, and in a larger ecosystem to boot.

[quote="jamestwebber, post:143, topic:102383"]
I think this is only possible if the plugins are in some kind of controlled registry, *or* it’s an opt-in choice to download a plugin.

[/quote]

We really have all the freedom to design this in a way that satisfies people’s concerns. I think people are overstating the severity, it’s not like any single organisation or user can reasonably audit what’s in pytorch v2.8.0 and all its dependencies. The corporate solutions I’ve seen at best do some basic filtering (+caching) and CVE scanning.

So if (for example) pytorch adds another dependency on a plugin that does CUDA-variant detection, how does that change the calculus? I don’t see how it does TBH. The only annoying thing would be that the docs have to tell you to install the plugin first, so that when you install pytorch, the plugin can actually do its job^[and then display a warning if you installed pytorch without the plugin that you should install the plugin and then reinstall pytorch to get the best-suited option to your system, etc.].

---

## Post #159 by ncoghlan

**Created:** 2025-08-18T00:15:15.768Z  
**Replies:** 0 | **Reads:** 107

[quote="Paul Moore, post:157, topic:102383, username:pf_moore"]
while I’ve not used torch or any of the other GPU-intensive libraries, I feel that if I did, needing to point pip at the correct index to pick up the libraries that are optimised for my system wouldn’t be *that* much of an ask
[/quote]

FWIW, if you'd asked me a couple of years ago (before I started on the Python component distribution prototype for LM Studio that became venvstacks), I would have felt much the same way (that is, why isn't an approach like piwheels.org adequate?).

In practice, the combinatorial explosion ends up being substantially worse, so even if a project like PyTorch can feasibly host variant wheels across at least some of the feature combinations they care about, and have at least some users put in the effort to configure their systems to use those, it's impractical for most projects to do the same (and even if they did, we'd be getting back into an `--allow-external` type situation, just aggregated in local user index config instead of centrally in PyPI file hosting links).

Relying on separate indexes also shifts the private index hosting situation from "run a private index for your organisation" to "run one for each hardware acceleration configuration you care about optimising for".

Edit: Discourse mobile post editor lost the plot, so this was initially posted half finished

---

## Post #160 by tgamblin

**Created:** 2025-08-18T07:38:02.907Z  
**Replies:** 0 | **Reads:** 105

[quote="pf_moore, post:157, topic:102383"]
[quote="jonathandekhtiar, post:146, topic:102383"]
Spack was another attempt taking everything on the opposite side (what if we just rebuild everything at install time) with compiler flags “local specific”.

[/quote]

Isn’t that precisely the opposite of this proposal - they explicitly avoid dealing with binary distribution, so they don’t have the problems we’re trying to solve here?

[/quote]

FWIW, we don’t explicitly avoid binary distribution. We support it.  See, e.g., cache.spack.io. Spack’s solver finds binaries from build caches (or from existing installations) and preferentially reuses them as long as they satisfy the user’s request (which can include constraints on variants). If it has to build, it solves for a build configuration that satisfies the user’s request. There is more on that in [this paper](https://arxiv.org/abs/2210.08404).

We also built and spun off a library for describing microarchitecture compatibility – [archspec](https://github.com/archspec/archspec). We use to deal with arch constraints in the spack solver (“will this binary be compatible with the host?), and I believe conda now uses it for virtual packages.

I would say in the spack universe we’re at the point where we support *too much* combinatorial-ness in the public build cache, and the current direction we’re taking is to pare it down so that we have a decent matrix of builds for hitting most major CPU and GPU platforms without losing performance. Users can still obviously build from source if that doesn’t work for them. If our survey is accurate, currently around 50% of users use their own local build caches and around 15% use the public ones. We want to increase that.

Anyway, this is very much a problem we care about in the Spack world – enabling binary installs in most environments without losing performance.

---

## Post #161 by tgamblin

**Created:** 2025-08-18T08:28:32.883Z  
**Replies:** 2 | **Reads:** 99

@jonathandekhtiar In reading through the PEP-to-be, this stands out:

> **Dependency Management**
>
> * How should dependencies be expressed when a package depends on a variant of another package?

I am not understanding the intended relationship between package variants, the install-time matching mechanism, and the solver.  These things are coupled.

The matching algorithm that the PEP describes says it’ll search for the “best” compatible variant available, and that it’ll fall back to, e.g., a CPU version if a GPU version is not available.

Doesn’t this assume that if I have several packages that support variants in my DAG, that any combination of variant configurations for those packages must compatible?  And is that always true?

Say the CPU and GPU versions of some package are not binary compatible, and you have to use the CPU version of one with the CPU version of the other, and the GPU version of one with the GPU version of the other. If you have packages A → B, B releases a GPU variant, but A doesn’t have one yet (maybe b/c it first needs to be tested with C’s?), won’t the matching semantics described in the PEP give you a bad installation, with the CPU version of A depending on the GPU version of B?  I would think you’d want to be able to specify to use CPU versions of both if GPU versions of both are not available. I could think of other combinations here that might fail if, say, wheels aren’t released with GPU variants in lockstep.

I think this kind of decision really needs to be made in the solver along with version selection, but that  would mean you’d need to modify pip’s solver to handle variants, and you’d need to get the provider plugins up front to figure out your target arch (so the solver would know).  The second problem seems easier than the first.

---

## Post #162 by mgorny

**Created:** 2025-08-18T09:41:19.288Z  
**Replies:** 1 | **Reads:** 100

[quote="pf_moore, post:157, topic:102383"]
In the interests of keeping things a manageable size, I’d recommend focusing mainly on prior art that implements solutions *similar* to what you’re proposing (dynamic selector plugins invoked at runtime to choose which binary artifact to download and install) - those would be much more helpful (IMO) than examples that demonstrate alternative approaches which wouldn’t suit Python .

[/quote]

I’m afraid that if you’re looking for a 1:1 solution that would work for Python, there simply isn’t one. The Python packaging ecosystem is different than other ecosystem facing similar problems, notably because:

1. It has very high stability / backwards compatibility expectations. Ideally, we are looking for a solution that would continue to work for years to come, with little changes required. What we were really trying to avoid is introducing a breaking change for a “local” solution that may turn out to be insufficient in 2-3 years, and require further breaking changes.
2. It has very little centralization in terms of maintenance, with lots of stakeholders maintaining their own packages with little central coordination. This is very much unlike Linux distributions or conda-forge where generally others can update your packages when necessary.
3. And finally, it also has very high compatibility requirements for old package versions. Unlike your average distribution which generally expects only a subset of recent package versions to work, on PyPI we generally want wheels published in the past to work too; and often with no ability to “fix” them the way, say, you could add a new build of an old package version to conda-forge.

What makes sense here is to evaluate existing solutions within their specific context and use case, and learn from their successes and deficiencies. However, in the end we are to some degree exploring new seas and we need to explore new ideas that are better suited to wheels and PyPI.

---

## Post #163 by steve.dower

**Created:** 2025-08-18T12:17:28.090Z  
**Replies:** 1 | **Reads:** 97

[quote="H. Vetinari, post:158, topic:102383, username:h-vetinari"]
Here’s some [context](https://github.com/conda/ceps/pull/103) about virtual packages work in conda-land
[/quote]

Some critical context that appears to be assumed in that doc is that conda will choose packages based on what's already installed, whereas most installers in PyPI-land will try to change what's already installed to match the best available package.[^1] So it doesn't (currently) quite work the same to tell PyPI-land installers "resolve against this imaginary `__cuda` package" because they'll (currently) decide to upgrade `__cuda` ;)

[^1]: `Requires-Python` is the closest thing available.

---

## Post #164 by Liz

**Created:** 2025-08-18T13:16:07.581Z  
**Replies:** 1 | **Reads:** 100

[quote="Michał Górny, post:162, topic:102383, username:mgorny"]
I’m afraid that if you’re looking for a 1:1 solution that would work for Python, there simply isn’t one. The Python packaging ecosystem is different than other ecosystem facing similar problems, notably because:
[/quote]

There's two things I don't think this response adequately captures.

1. *Why* do other ecosystems not need 15+ different axis while assuming there will be more in the future, requiring selectors.
2. How does this impact other concerns beyond performance targets, such as security, or the ability for users to reason about this and troubleshoot when a download doesn't go as they expect?

I can't say I have answers to that that match why certain decisions were made, but I do think that this is an unreasonable amount of build variation to support in prebuilt binary packages, and that any gains from this rather than picking a few different support levels and commiting to updating those *When there is demand for them* are not worth the costs as presented.

If we take just the "there are at least 15 dimensions" bit at face value, and say that there are only 2 values or unused per dimension (which is far fewer than people have suggested), that's still over 14million combinations at a worst case at the initial minimum supported dimensions.

This needs to be pared down, it's not a reasonable explosion of potentially downloaded files, and this could be abused if someone uploaded *one* malicious binary release matching a potential victim, while all other files are built normally, and with the amount of build variation here, I don't think the ecosystem would catch that happening.

___

It also has a cost on people's expectations.

People have said things like "it isn't download+unpack that's changing, we're just changing how wheels are selected", but that misses the point. To download the wheel that is most appropriate, it now involves running code provided by the package to be downloaded, whether it is in that step itself or not. We are regressing on something wheels improved.

Currently, while restricting to wheels and excluding sdists, people have a reasonable assumption of where remote code may be executed and where it will not. The authors have presented this seemingly presuming that it is okay to change that, and that it should be opt-out, not opt-in. I cannot agree with this.

Both of these concerns are addressable if we can agree on a handful of community supported hardware target levels based on real hardware configurations that people have demand for, and commit to refreshing that set of configurations as common hardware changes. Falling back to the closest supported target while still allowing the user to build from source to maximize performance more closely aligns with other ecosystems, and there is likely a reason for that.

The cost of the combinations here is not just on those building and serving the artifacts.

---

## Post #165 by rgommers

**Created:** 2025-08-18T15:26:54.563Z  
**Replies:** 0 | **Reads:** 98

[quote="pitrou, post:142, topic:102383"]
[quote="rgommers, post:139, topic:102383"]
* Debian-based distros have had `multiarch`( [Multiarch/HOWTO - Debian Wiki](https://wiki.debian.org/Multiarch/HOWTO) ) support for a long time, and other Linux distros have similar mechanisms.

[/quote]

Ok, but what does this have to do with SIMD support levels? Here on Ubuntu 24.04:

[/quote]

@pitrou I wrote that too quickly and mixed things up, sorry about that. IIRC there was a distro handling this through `multiarch` but I cannot find it anymore (or I was just wrong). The actual thing I should have pointed at is `glibc-hwcaps`, which is newer (glibc >=2.33, 2021).  That’s what some distros are using for package-level switching between psABI levels. See, e.g., [here](https://www.theregister.com/2023/03/09/opensuse_finds_x86_64_solution/) for OpenSUSE, [here](https://hpc.guix.info/blog/2022/01/tuning-packages-for-a-cpu-micro-architecture/) and [here](https://guix.gnu.org/en/blog/2024/building-packages-targeting-psabis/) for Guix. It’s possible for Debian as well, see [this overview](https://wiki.debian.org/InstructionSelection) and [this blog post](https://www.kvr.at/posts/easy-dynamic-dispatch-using-GLIBC-hardware-capabilities/). @mgorny already posted how Gentoo does this kind of package-level switching. For Fedora it seems in the works, see [this proposal](https://fedoraproject.org/wiki/Changes/Optimized_Binaries_for_the_AMD64_Architecture_v2). Fedora, RHEL 9 and SUSE also moved to `x86-64-v2`, dropping support for v1 CPUs completely. Ubuntu didn’t yet, but [is experimenting](https://ubuntu.com/blog/optimising-ubuntu-performance-on-amd64-architecture).

I hope that clarifies the current status. I’ll edit my previous post to correct the mistake and link to this summary.

---

## Post #166 by msarahan

**Created:** 2025-08-18T16:30:55.409Z  
**Replies:** 2 | **Reads:** 98

[quote="h-vetinari, post:158, topic:102383"]
[quote="pf_moore, post:157, topic:102383"]
[quote="jonathandekhtiar, post:146, topic:102383"]
If you want to look in the python world - conda virtual packages are one of the reasons people adopted conda forge in the scientific compute space.

[/quote]

I know very little about conda. Could you give me a pointer to some sort of example that shows how conda handles the sort of “20-30 different namespaces” problem that you referred to here?

[/quote]

Here’s some [context](https://github.com/conda/ceps/pull/103) about virtual packages work in conda-land . The situation is simpler because it’s a single tool for a single ecosystem, and those detection capabilities are vendored into conda itself. In turn, conda doesn’t cover nor distinguish the full set of 20-30 different dimensions that would conceivably become necessary if this is solved through plugins, and in a larger ecosystem to boot.

[/quote]

There’s two major patterns that I’ve seen. One is the virtual package approach that @h-vetinari pointed to. This is the best example for hardware-based dispatch, because the virtual packages are immutable, and they rely on detection of a property that is external to the package manager. This detection is the part that requires execution of code that people are concerned about.

The other major pattern is that the user specifies some particular variant value, and that then becomes a constraining property of the environment. This is used when there’s more than one implementation choice for a package, such as MPI, where the environment should use only one implementation. This does not require execution of code, other than the user needing to specify the variant to the solver. The state is encoded in which packages are installed. [Conda-forge has documentation for how MPI is implemented](https://conda-forge.org/docs/maintainer/knowledge_base/#message-passing-interface-mpi). It is a convention, not a standard, but it’s a long-established pattern that is a good reference.

As Steve pointed out:

[quote="steve.dower, post:163, topic:102383"]
Some critical context that appears to be assumed in that doc is that conda will choose packages based on what’s already installed, whereas most installers in PyPI-land will try to change what’s already installed to match the best available package. So it doesn’t (currently) quite work the same to tell PyPI-land installers “resolve against this imaginary `__cuda` package” because they’ll (currently) decide to upgrade `__cuda` :wink:

[/quote]

This precludes or at least complicates the second major pattern. I don’t think `__cuda` is a concern, because it is not a package that PyPI-land installers would directly control. Anything like keeping MPI implementation would definitely require new behavior for PyPI-land installers. My humble opinion is that solving the environment completely, including constraints for all installed packages, would be helpful to users regardless.

One design that was discussed along the way was to not do install-time detection of “virtual packages” or equivalent. Instead, the user would manually choose to install some number of hardware detection plugins, and the user would manually run a tool that used plugins to detect, collect, and write the variant information to a file. The PyPI-land installer would then use this file to choose variant packages. This file would also be human-editable. I haven’t been following closely enough to know why this approach was discarded, but I think it is a larger ask of users than the dynamic approach. Again, user experience (minimizing necessary end-user action) vs (reasonable) concerns about code execution and principle of least surprise.

---

## Post #167 by msarahan

**Created:** 2025-08-18T16:56:22.761Z  
**Replies:** 1 | **Reads:** 96

[quote="Liz, post:164, topic:102383"]
1. *Why* do other ecosystems not need 15+ different axis while assuming there will be more in the future, requiring selectors.
2. How does this impact other concerns beyond performance targets, such as security, or the ability for users to reason about this and troubleshoot when a download doesn’t go as they expect?

I can’t say I have answers to that that match why certain decisions were made, but I do think that this is an unreasonable amount of build variation to support in prebuilt binary packages, and that any gains from this rather than picking a few different support levels and commiting to updating those *When there is demand for them* are not worth the costs as presented.

If we take just the “there are at least 15 dimensions” bit at face value, and say that there are only 2 values or unused per dimension (which is far fewer than people have suggested), that’s still over 14million combinations at a worst case at the initial minimum supported dimensions.

[/quote]

No single package needs 15 axes. The entire system may have that much variance, but any single package will be a much smaller subset. Conda has had this since 2017. It has not exploded. Most often, it is not a means of supporting several values of several dimensions, but rather to allow differentiation of packages that are built against different dependencies. For example, when the ecosystem is transitioning from one major version of a library to another, a variant allows “stable” environments to use the newer build with an older dependency, while also providing a path for cutting-edge environments. This hasn’t been a concern for many PyPI-land users because it’s mostly a problem with binary compatibility. The AI/ML/data science space feels this much more keenly than people who do not rely on compiled extensions. If you try to collapse some set of libraries or virtual packages or whatever (“a handful of community supported hardware target levels…”), you end up with something like manylinux. Manylinux isn’t bad, but it does not capture the inherent complexity of packaging. It requires hacks as discussed ad nauseam in [prior DPO threads](https://discuss.python.org/t/wheelnext-wheel-variants-an-update-and-a-request-for-feedback/102383) to shoehorn additional dimensionality. “Community supported hardware target levels” will never be complete and put the maintenance burden of defining those levels on someone like PyPA. It does not provide sufficient description flexibility to support the use cases that I’ve seen with Conda.

---

## Post #168 by barry

**Created:** 2025-08-18T17:06:28.071Z  
**Replies:** 2 | **Reads:** 95

[quote="Mike Sarahan, post:166, topic:102383, username:msarahan"]
Instead, the user would manually choose to install some number of hardware detection plugins, and the user would manually run a tool that used plugins to detect, collect, and write the variant information to a file. The PyPI-land installer would then use this file to choose variant packages. This file would also be human-editable. I haven’t been following closely enough to know why this approach was discarded, but I think it is a larger ask of users than the dynamic approach.
[/quote]

ISTM that these approaches are compatible, as long as we specify the client-side variant preference configuration file format.  You're an experienced user who knows exactly what you want in your environment?  You can hand-write this config file and no variant plugins are needed.  

You're a beginner who really doesn't understand the complex stack of software, just want to start your deep learning journey and trust your toolchain or environment to keep you safe?  Let the installer run with its plugins to generate that variant description file automatically.  Or run that script out of band to generate the file and the installer can just use it without having to run any variant plugins.  I could imagine such a script could use PEP 723 inline metadata for an easy experience^[and educational too, especially if that tool included some comments to tell you why it chose the variants it chose].

---

## Post #169 by msarahan

**Created:** 2025-08-18T17:12:48.722Z  
**Replies:** 0 | **Reads:** 91

Yes, they are compatible. The sticking point is the question of whether the installer is allowed to run these without the user’s explicit approval.

---

## Post #170 by charliermarsh

**Created:** 2025-08-18T17:14:07.307Z  
**Replies:** 1 | **Reads:** 94

[quote="pf_moore, post:157, topic:102383"]
To be specific, on a purely personal basis, I don’t understand why all of this is such a big deal. I’ve never found the current state of affairs with numpy/scipy and BLAS to be a problem, and while I’ve not used torch or any of the other GPU-intensive libraries, I feel that if I did, needing to point pip at the correct index to pick up the libraries that are optimised for my system wouldn’t be *that* much of an ask. So for me, as a user and as a pip maintainer, I’d be inclined to do the bare minimum to support wheel variants. And in the absence of a standard that says “this is the absolute minimum needed to provide a good user experience for a broad range of users, and installers must implement at least this level of functionality” I’d push back hard on any PRs that added significant extra complexity to pip in order to support extra wheel variant functionality.

[/quote]

Can I ask, what evidence would you want to see that would change your mind? Specifically, I’m wondering if there’s evidence (or elaborations RE why the current solutions are insufficient) that should be included in the PEP’s motivation section that you or other readers would find compelling.

---

## Post #171 by pf_moore

**Created:** 2025-08-18T17:16:03.983Z  
**Replies:** 3 | **Reads:** 99

[quote="Todd Gamblin, post:161, topic:102383, username:tgamblin"]
Doesn’t this assume that if I have several packages that support variants in my DAG, that any combination of variant configurations for those packages must compatible? And is that always true?
[/quote]

This question concerns me. The selector process has been presented as *only* being involved in the step where the "correct" wheel for version X.Y of package A is picked. But I'm now wondering whether that's too simplistic.

Suppose we request numpy and scipy. And suppose that there are BLAS and MKL^[Excuse me if I've got the terminology wrong.] variants of both, and the BLAS and MKL variants are incompatible (so you can't install BLAS numpy and MKL scipy). Now suppose scipy only publishes the BLAS version, but the MKL version is preferred if available. Let's assume the user's environment is compatible with both BLAS and MKL.

(Side note - if any of the above makes no sense for numpy/BLAS/MKL, imagine a *different* selector that works like this. I'm trying to keep the example from being too abstract, but I don't want the underlying problem to be ignored because "MKL and BLAS don't work like that").

Now, the resolver comes along and selects numpy to consider first. It picks the MKL version of numpy. So far, so good. Now it looks at scipy, and finds that the only scipy wheel is a BLAS one. There's nothing in the dependency metadata that says this isn't compatible with the numpy version selected, so how is the *resolver* (as opposed to the wheel selector^[the finder, in pip's terminology]) to know that there's a problem here? And even if it does, what can it do? The resolver only has the ability to backtrack to an older *version* of numpy, not to try a different wheel. 

And here's a second potential issue. Suppose the user wants to install A==1.0 and B==2.0. A comes in BLAS and MKL variants. And suppose that the MKL variant depends on B==1.0, but the BLAS variant has no dependency on B. Once again the finder will pick the MKL A, and then report that no resolution is possible, because two conflicting versions of B have been requested. This again isn't fixable without the resolver knowing about variants, and *taking them into account* in its backtracking process.

I should note with the second example that the standards allow two distinct wheels for the same version of a package to have different metadata (including dependencies). I believe that uv makes a simplifying assumption that this doesn't happen in practice, and while I agree that's a sensible engineering tradeoff for a tool to make, it's *not* something we can do in a standard. So we need to consider how the second example should work, no matter how unlikely we think it might be in practice :slightly_frowning_face:

A final note here - I'm sensing a certain level of frustration from some of the proposal authors, that people are trying to find fault with the proposal. I hope that isn't the case, but I can see how it might feel that way after all the work that's been put into developing this. Please understand that I'm *not* trying to wreck the proposal here. Quite the opposite - my goal is to make sure that whatever standard we end up with is as robust and comprehensive as we can make it. But in order to do that, I want to ensure that all the possible edge cases have been considered and addressed - which means that I hope the proposal authors can take these issues seriously, and not simply dismiss them as "never going to happen in practice"^[If I had a penny for every issue that I've seen that was never going to happen in practice...].

---

## Post #172 by oscarbenjamin

**Created:** 2025-08-18T17:43:16.619Z  
**Replies:** 0 | **Reads:** 95

[quote="Barry Warsaw, post:168, topic:102383, username:barry"]
ISTM that these approaches are compatible, as long as we specify the client-side variant preference configuration file format. You’re an experienced user who knows exactly what you want in your environment? You can hand-write this config file and no variant plugins are needed.
[/quote]

I think they are not just compatible but necessarily go together. You can have explicit selection without automatic selection but I don't think that you can have automatic selection without providing the option for explicit selection. Especially as noted above some choices like OpenBLAS vs MKL cannot be made automatically.

It seems to me that some way of selecting the variants explicitly is a prerequisite before having any automatic selection mechanism. Maybe it makes more sense to focus on getting the pieces needed for explicit selection first.

---

## Post #173 by mikeshardmind

**Created:** 2025-08-18T17:53:51.349Z  
**Replies:** 0 | **Reads:** 94

[quote="Mike Sarahan, post:167, topic:102383, username:msarahan"]
“Community supported hardware target levels” will never be complete
[/quote]

Do they need to be complete though? Realistically, if we said the dimensions we were adding on this were 3 GPU library versions for each of rocm and cuda, x86-64 v 1-4, and 4 blas implementations, and the logic for how to prefer them, wouldn't just that matrix cover the vast majority of cases not currently covered? We can pretty reasonably help a large portion of users with much fewer costs to the ecosystem if we can limit the scope more.

I don't think there's any reasonable way to reconcile the "open index, open selectors, per package variants" version here with existing concerns and expectations.

[quote="Mike Sarahan, post:167, topic:102383, username:msarahan"]
No single package needs 15 axes. The entire system may have that much variance, but any single package will be a much smaller subset.
[/quote]

With some of what has been presented about blas, and with packages depending on other packages, I'm not sure there's a meaningful difference here. The entire system having it, and it being per package means either dependency hell, or requiring resolvers backtrack with this and rerun selectors as they eliminate options.

---

## Post #174 by pf_moore

**Created:** 2025-08-18T17:55:20.814Z  
**Replies:** 1 | **Reads:** 96

[quote="Charlie Marsh, post:170, topic:102383, username:charliermarsh"]
Can I ask, what evidence would you want to see that would change your mind?
[/quote]

Change my mind about what? That I'd be OK with the current state of affairs? Short of me needing to do far more advanced work than I currently do, I don't see that happening.

I think you're missing my point though. I'm saying that as a pip maintainer, my personal experience doesn't give me a basis for deciding what makes a good UX for pip users who need this functionality. And I think the other pip maintainers are in a similar situation. That's not a problem as such - we cannot expect maintainers of a tool as general as pip to understand every aspect of their users' business^[Astral may be a special case - you have money :slightly_smiling_face: My point applies for volunteer projects, though.]. But it's why I want standards to be as explicit as possible over what's needed - as a *substitute* for the experience the maintainer group(s) lack. Because my responsibility as a pip maintainer includes keeping the code base maintainable, and part of that is not including extra complexity when I don't see a need for the functionality it introduces.

As the (potential^[everything could change if the Packaging Council proposal gets approved, of course!]) PEP delegate, my position is different. In that context, I want the standards to say what's needed because if everything is a tool choice, I foresee yet another endless UI debate on the pip tracker, with no usable functionality available to users for ages. And I don't think that's a good result for the ecosystem or the user community.

It's hard juggling two roles when one of them forces me to be annoyed with myself in the other one :roll_eyes:

---

## Post #175 by rgommers

**Created:** 2025-08-18T18:29:19.674Z  
**Replies:** 3 | **Reads:** 97

[quote="pf_moore, post:171, topic:102383"]
[quote="tgamblin, post:161, topic:102383"]
Doesn’t this assume that if I have several packages that support variants in my DAG, that any combination of variant configurations for those packages must compatible? And is that always true?

[/quote]

This question concerns me. The selector process has been presented as *only* being involved in the step where the “correct” wheel for version X.Y of package A is picked. But I’m now wondering whether that’s too simplistic.

[/quote]

It isn’t too simplistic I think. To answer @tgamblin ‘s question: that is *not* a problem that we intend to solve here. I’m going to quote from way higher up to answer why:

[quote="steve.dower, post:34, topic:102383"]
[quote="ncoghlan, post:30, topic:102383"]
What makes this particularly hard isn’t selecting the variant for *one* project, it’s selecting a *consistent* set of variants across *multiple* projects that need to match with each other on *multiple* dimensions.

[/quote]

I really don’t see any alternative approach for this besides those projects actively trying to detect the same things, so they can reach the same conclusions independently

[/quote]

Steve has got it right here I think.

To illustrate with the numpy-mkl + scipy-openblas example:

* Both packages should depend on the same `blas-provider` that defines the `blas` property and `mkl`/`openblas` values for it,
* If `numpy` and `scipy` are installed at the same time with a variant-aware installer (e.g., `[uv] pip install numpy scipy`), then *independently* they’ll end up with the same variant choice (both `mkl` or both `openblas`)
* If either the installs are separate and in the meantime something changed (e.g., a new `blas-provider` was released which changes the priority around) or the user somehow forces choosing `numpy-mkl` and `scipy-openblas`, then that’s what that user gets in their environment.
  * That still does not break things for the BLAS example, those variants are not actually mutually exclusive (just suboptimal, just like today)
* For another hypothetical case (a realistic example from anyone would be great) where variant builds are indeed mutually exclusive: the solution is to construct the environment at once, ideally declaratively, which will avoid the problem.
  * The `conda` ecosystem has that same problem (to a lesser extent). It was always possible to get a suboptimal solve when doing multiple sequential `conda install xxx` invocations; for a very long time the advice has to been to avoid that. At some point, environments degrade if you continue to install packages one by one - just don’t do that.

Taking the variant info of all already installed packages into account for resolving new variants has not been implemented, and isn’t seriously considered. It’s something that can be done at the installer level of course - a `uv add xxx` will resolve the whole environment I believe, and in some cases that may get one a more optimal solve. But it’s not necessary to improve on the status quo.

---

## Post #176 by pf_moore

**Created:** 2025-08-18T20:55:36.610Z  
**Replies:** 4 | **Reads:** 99

[quote="Ralf Gommers, post:175, topic:102383, username:rgommers"]
To answer @tgamblin ‘s question: that is *not* a problem that we intend to solve here.
[/quote]

Thanks for the reply. I'm going to have to think about it some more, as I'm not yet completely convinced that it's a problem that currently exists (and it's a very different situation for the proposal to choose not to solve an existing problem, versus to not solve a problem that the proposal itself introduced). But I'll come back with more detailed comments when I've thought things through some more.

[quote="Paul Moore, post:174, topic:102383, username:pf_moore"]
Change my mind about what? That I’d be OK with the current state of affairs? Short of me needing to do far more advanced work than I currently do, I don’t see that happening.
[/quote]

I think I was focusing too much on my personal use cases here. To expand a little more, the evidence I'd want to see is issues raised by *pip users*, ideally on the pip tracker, that showed that missing functionality in pip in this area is making things harder for them. Right now, as far as I can see this is a non-issue on the pip tracker - the only thing that I can see which is even remotely related is the question of providing a way to prioritise indexes. That's more general than this issue, but one of the cited use cases is more robust selection of the right index for torch packages. And the impression I get from the pip issue isn't that the current approach of using an index per GPU configuration needs replacing, but rather that the UI around *selecting* the right index needs improvement.

My view is that we (the pip maintainers) already have far more feature requests than we have bandwidth to handle - not just to implement, but even to review PRs. So we need to be very careful to direct our efforts towards features that are the most important to our users. And there's no suggestion at the moment that wheel variants (or *any* change to the status quo around fine grained binary choices) are a high priority to our users.

It's entirely reasonable to argue that without a reasonable way to *distribute* multiple variants of wheels, pip users won't have a need to *install* them. But that still means that we'd be directing effort at something that might be useful to our users in the future, rather than working on something that's definitely of use to our users right now. And that's a hard trade-off to justify. (To be fair, even contributing to this discussion is using time that could otherwise be spent on new pip features, so it's not a black and white choice...)

---

## Post #177 by jamestwebber

**Created:** 2025-08-18T21:27:12.460Z  
**Replies:** 0 | **Reads:** 95

[quote="pf_moore, post:176, topic:102383"]
To expand a little more, the evidence I’d want to see is issues raised by *pip users*, ideally on the pip tracker, that showed that missing functionality in pip in this area is making things harder for them. Right now, as far as I can see this is a non-issue on the pip tracker

[/quote]

I wonder how much this is influenced by users just switching to other tools when they realize pip doesn’t do what they need. That’s how I switched to `conda` all those years ago. It didn’t occur to me to write an issue on the pip tracker to request that they solve a large ecosystem problem that wasn’t under their control.

---

## Post #178 by dstufft

**Created:** 2025-08-18T21:31:20.692Z  
**Replies:** 0 | **Reads:** 93

[quote="pf_moore, post:171, topic:102383"]
The resolver only has the ability to backtrack to an older *version* of numpy, not to try a different wheel.

[/quote]

This seems like it’s kinda broken? The world already exists such that you can have multiple wheels for the same version be compatible with the target environment, and each of those wheels can have different dependencies.

---

## Post #179 by tgamblin

**Created:** 2025-08-18T21:35:32.054Z  
**Replies:** 0 | **Reads:** 100

[quote="rgommers, post:175, topic:102383"]
If `numpy` and `scipy` are installed at the same time with a variant-aware installer (e.g., `[uv] pip install numpy scipy`), then *independently* they’ll end up with the same variant choice (both `mkl` or both `openblas`)

[/quote]

I may be missing something here, but how do you guarantee that they will do this, unless all simultaneously installed packages are released in lockstep, with all possible variant values, without removing or adding any values?

Suppose above that `scipy` decides to remove MKL support and makes a release, independent of `numpy`. The user specifies that their favorite BLAS is MKL, but if `uv pip install numpy scipy` selects variants independently, `numpy` will come back with `MKL` enabled and `scipy` will come back with `openblas`, right?  How do you deal with variant values (or variants) being added or removed over time?  We do see issues like this in Spack, but we can specify these types of dependencies.

Put differently – I’m not sure this is an issue *only* when considering installed dependencies.

---

## Post #180 by tgamblin

**Created:** 2025-08-18T22:25:21.151Z  
**Replies:** 1 | **Reads:** 106

Let me prefix this by saying I’m also not trying to wreck this PEP, but I have a few more concerns based on how our packages have evolved in Spack.

The main one is here:

[quote="rgommers, post:175, topic:102383"]
Both packages should depend on the same `blas-provider` that defines the `blas` property and `mkl`/`openblas` values for it,

[/quote]

BLAS support isn’t *really* a property, it’s a dependency. You could argue it’s an option on a package (enable `blas`, or `+blas` as we’d say in spack world) *plus* a link-time dependency that’s required when the option is enabled. In Spack we define both – one’s a package in the DAG and the other is a variant on the dependent(s) of that package. So if you ask for `foo +blas` the solver picks a BLAS for you. If you ask for `foo +blas ^intel-mkl`, you get `intel-mkl` and so must everyone else. 

It’s that link dependency that forces unification for us – the solver *enforces* that there is *one* version of any given package (or virtual package, like blas) in any given runtime graph (basically your transitive link/run dependencies, excluding pure build dependencies). Put differently, we ensure that there is only one configuration of any link dependency for any packages that might end up using it in the same process, *and* we ensure that the packages that need it are built against it.

Unification is key for C++ and many other compiled languages– it’s what keeps you from violating the one definition rule, and it’s what keeps your ABI consistent.

In Spack for a very long time (well, until like a month ago), *compilers* were attributes on nodes. i.e., a node would say that it was compiled with `gcc@13.0.1`, and that was all the metadata we had about that. We had heuristics that would try to match compilers across nodes to make things consistent, but there were all sorts of corner cases. Users would try to mix `gcc` and `intel` compilers,  something you often want to do, but we couldn’t ensure that `intel@x.y.z` and `gcc@a.b.c`were using the same *runtime library*, and we couldn’t *unify* the runtime library across all nodes in the same process. Runtime libraries are unified dependencies, which have different semantics from non-unified node attributes.

To fix this has been a lot of work over many years, and we *finally* merged a solver that could do it earlier this year. The compiler (or really any package) can say at solve time what runtime libraries need to be linked with its dependents, *based on the languages the compiler provides to its dependent*. I think we get this right (finally) because it abstracts both the attributes (“`cxx` or `fortran` is enabled on this package” – which model the undefined symbols / ABI calls needed by a package) *and* the dependencies that could satisfy them (which could be different libraries that need to be unified across different packages).

All this is to say that there are a lot of holes when modeling ABIs/runtime libraries/etc. as attributes. You need some way to unify dependencies, and you likely can’t cram all that into attributes.

Maybe for CUDA this stuff works ok – there are a lot of steps NVIDIA has taken to ensure compatibility across compute capabilities. I do not think the same can be said for ROCm at this point. And BLAS implementations are notoriously bad for this.

[quote="rgommers, post:175, topic:102383"]
Taking the variant info of all already installed packages into account for resolving new variants has not been implemented, and isn’t seriously considered. It’s something that can be done at the installer level of course - a `uv add xxx` will resolve the whole environment I believe, and in some cases that may get one a more optimal solve. But it’s not necessary to improve on the status quo.

[/quote]

I do not disagree that this proposal would improve the status quo a lot. What I worry about is whether this will require a huge breaking change to fix in the long run for backward compatibility, when users *do* want this stuff handled more automatically. It did for us, and I think it was worth it, but our users will put up with more than the typical pip user. I think you should consider how variants would evolve (especially as hardware, particularly AI hardware becomes more diverse) and what it will take to handle the *next* bit of complexity after more packages start using wheel variants.  I am not convinced that attributes alone can manage this in the limit, without a much more sophisticated solver.

---

## Post #181 by tgamblin

**Created:** 2025-08-18T22:48:54.995Z  
**Replies:** 1 | **Reads:** 97

[quote="pf_moore, post:176, topic:102383"]
But that still means that we’d be directing effort at something that might be useful to our users in the future, rather than working on something that’s definitely of use to our users right now. And that’s a hard trade-off to justify. (To be fair, even contributing to this discussion is using time that could otherwise be spent on new pip features, so it’s not a black and white choice…)

[/quote]

This view concerns me, as I think the issue this PEP is trying to solve is *fundamental* to future hardware needs of AI/data analysis/modsim/etc. users. That’s a set of users that is rapidly growing, and fixing this problem would be transformative for them. The problem has been a fundamental issue for HPC for a long time, and HPC has always been easy to dismiss as a niche, but it’s real this time – AI *is* HPC and hardware actually matters.

I like to think that something could just come along and replace `pip` and solve this problem, and maybe `uv` or `spack` or something *could* do that, but on the Spack side at least we cannot keep up with the pace of package development in Python. To scale, we will likely need to rely on PyPI metadata in the long run. That metadata comes right from the package developers. We can (clearly) make tools that replace `pip` but it is much harder to replace the metadata that `pip` uses. If the metadata lacks the information needed to pick the most optimized versions of packages, other tools (not just pip) are going to have a hard time meeting users’ needs. 

Hardware is not getting any less diverse – AMD GPUs are coming on the scene and there are zillions of accelerators that *also* need optimized libraries to work… so I don’t see the combinations decreasing. You’ve also got x86_64, ARM, and RISC-V on the horizon, so there are CPU dimensions to choose from as well. With Moore’s law on the way out, specialization (in hardware) is going to be how people get performance.

So, I think it’s worth some short-term pain to address longstanding tech debt, especially when interest rates (on hardware support) are going up.  Without this, things are going to be *much* more painful for users in the future, enough to outweigh the benefits of a lot of smaller short-term improvements.  This is really a strategic decision, not a tactical one.

---

## Post #182 by charliermarsh

**Created:** 2025-08-18T22:54:25.245Z  
**Replies:** 1 | **Reads:** 95

[quote="pf_moore, post:176, topic:102383"]
I think I was focusing too much on my personal use cases here. To expand a little more, the evidence I’d want to see is issues raised by *pip users*, ideally on the pip tracker, that showed that missing functionality in pip in this area is making things harder for them. Right now, as far as I can see this is a non-issue on the pip tracker - the only thing that I can see which is even remotely related is the question of providing a way to prioritise indexes. That’s more general than this issue, but one of the cited use cases is more robust selection of the right index for torch packages. And the impression I get from the pip issue isn’t that the current approach of using an index per GPU configuration needs replacing, but rather that the UI around *selecting* the right index needs improvement.

[/quote]

Thanks, that’s helpful, though I’m wondering if it’s unproductive, then, for me to try and argue that this is a problem, and to explain why (in my opinion) “selecting the right index” doesn’t solve it. As a different tack, we get a lot of issues in uv that ultimately derive from these problems, and those issues are not specific to uv, and would also affect pip users. If that sounds relevant, we could compile a list.

---

## Post #183 by tgamblin

**Created:** 2025-08-18T23:03:14.622Z  
**Replies:** 0 | **Reads:** 103

[quote="charliermarsh, post:182, topic:102383"]
As a different tack, we get a lot of issues in uv that ultimately derive from these problems, and those issues are not specific to uv, and would also affect pip users. If that sounds relevant, we could compile a list.

[/quote]

There are constant issues in Spack around this set of problems, on both the source configuration and binary installation sides. As we move to make binaries “more” default there are going to be more. We introduced ABI substitution (splicing) (see [here](https://khoury.northeastern.edu/~arjunguha/main/papers/2025-gouwar-spack.html) and stay tuned for the arXiv version) in 0.23 and plan to use it more. MPI will soon have [an ABI](https://arxiv.org/abs/2308.11214) and I suspect people will start to want to package MPI things in Python.

So, we could try to compile a list as well.

---

## Post #184 by willingc

**Created:** 2025-08-18T23:23:40.206Z  
**Replies:** 2 | **Reads:** 106

[quote="tgamblin, post:181, topic:102383"]
This view concerns me, as I think the issue this PEP is trying to solve is *fundamental* to future hardware needs of AI/data analysis/modsim/etc. users. That’s a set of users that is rapidly growing, and fixing this problem would be transformative for them. The problem has been a fundamental issue for HPC for a long time, and HPC has always been easy to dismiss as a niche, but it’s real this time – AI *is* HPC and hardware actually matters.

[/quote]

Thanks @tgamblin for repeating this. 

Meeting the needs of science, data science, and AI is “not a nice-to-have”; it’s a “must-have” for Python to continue to grow and evolve. If Python fails to address these fundamental needs, we will see greater attrition to Rust.

Does that mean that this solution is perfect? No, it’s not, but right now it’s the best solution on the table. A cross-section of our community has put great thought and effort into an approach and prototype. I recognize that readers will need some time to digest this information since it is new to many in this thread.

@pf_moore @dstufft and others, you have done a great labor of “love/necessity” in maintaining pip. I am incredibly grateful for the 75% of my work that I can get done using pip. Yet, there is still 25% of the time where I must reach for tools other than pip. 

From the bottom of my heart, the past 2 years have given me hope that we can create packaging standards that go beyond being tool-centric.

I encourage everyone to keep finding common ground and iterating toward something better than the “status quo”.

---

## Post #185 by dstufft

**Created:** 2025-08-19T01:34:43.655Z  
**Replies:** 1 | **Reads:** 108

I’ve barely been involved in pip’s development in a long time now, others have done a lot more there than me :slight_smile:

I do agree though ^[And as I said earlier, I am employed by NVIDIA, but this is my personal opinion.] though that we need to figure out a solution to this, but I doubt it’s something that’s likely going to be surfaced in the pip issue tracker, because I don’t think it’s a pip issue really, and I think the lack of a solution is creating issues throughout the ecosystem.

One part of that is the proliferation of “variant” packages on PyPI. If we look at the [PyPI stats page](https://pypi.org/stats/) ^[Chosen because a lot of these packages are also the biggest packages, so it makes it easier to find them.], we can see a lot of `-gpu`, `-cpu`, `-cuNN`, `-rocm`, `-intel`, etc. This not only makes PyPI harder to use because the same project is being spread over several projects based entirely on compiler flags ^[Or what is effectively compiler flags], but it trains users to expect things that make certain forms of typo squatting easier. It’s becoming normal for projects to have a bunch of adhoc-ly named clones of themselves on PyPI, which makes it easier for an attacker to go publish something like `tensorflow-cu14` and appear to be legitimate ^[Of course this was always something that they could do, but it used to be “weird” to do that, so it looked unexpected, but now we’re training people that it’s normal and expected.].

It also makes more work for PyPI, as each new variant of these projects often end up needing to have it’s limits increased to match the previous variants limits.

I was curious, so I did a google search for `pip gpu site:reddit.com`, and these are some of the results I got.

* User who can’t get a package to compile against CUDA and attempting to use the prebuilt binaries always uses the cpu. ([link](https://www.reddit.com/r/LocalLLaMA/comments/1ga7wr8/getting_gpu_acceleration_to_work_in_llamacpppython/))
* A user who couldn’t get GPU support enabled for llama-cpp-python, and one of the commenters indicate that they dropped Python completely due to how painful it was to get it installed. ([link](https://www.reddit.com/r/LocalLLaMA/comments/1evdnz1/how_to_enable_cudasupport_for_llamacpppython/))
* A user who is using the custom indexes, who can’t seem to get the GPU enabled version of PyTorch to install at all. ([link](https://www.reddit.com/r/CUDA/comments/1i41jev/pytorch_not_detecting_gpu_after_installing_cuda/))
* A user that wrote a guide to actually getting all of this installed, including a script he runs on venv activation just to make sure GPU support didn’t accidentally get uninstalled (and includes pip install  to make it work). ([link](https://www.reddit.com/r/StableDiffusion/comments/1k23rwv/quick_guide_for_fixinginstalling_python_pytorch/))
* A user that has spent 5 hours trying to get things working. This wasn’t solely Python packaging issues, but was partially caused by that. This includes several people commenting that they use docker containers to completely avoid having to figure out how to install this software in a way that works. ([link](https://www.reddit.com/r/learnmachinelearning/comments/1f59yda/please_help_trying_to_install_torch_for_gpu/))
* Another user, whom I’m not entirely sure what the problem actually ended up being, but mentioned that this was the most annoying library to try and install. ([link](https://www.reddit.com/r/learnpython/comments/1gp2f2d/help_with_tensorflowandcuda_download/))
* Another user asking why installing tensorflow is so hard, mentions that pip “worked” but GPU support wasn’t enabled. Several commenters indicating they either used docker to side step it or complaining getting everything setup and working is difficult. ([link](https://www.reddit.com/r/learnmachinelearning/comments/sqoufs/whats_the_deal_with_installing_tensorflow/))
* Someone posting how they got their tensorflow to have GPU support, and commenter mentions that their post helped them after 10 hours of trying to figure it out. ([link](https://www.reddit.com/r/tensorflow/comments/1fctumm/windows_10_tensorflowgpu_with_cuda_118_and_cudnn/))
* Someone who is very angry about how hard it is to install all of these things, and listed a lot of the problems he had (not all of which are Python packaging). ([link](https://www.reddit.com/r/StableDiffusion/comments/1hzkcxa/i_fuing_hate_torchpythoncuda_problems_and/))
  
  Some quotes:
  * is it “sageattion” is it “sageattn_qk_int8_pv_fp8_cuda” is it “sageattn_qk_int8_pv_fp16_cuda”? etc.
  * Now you need to get WHEELS and install them manually
  * Cuda and PyTorch is absolute bananas.
  * The only sane way is to use docker
  * I only got Triton to work by manually downloading and installing pre-compiled wheel.
  * For torch, I keep few different .whl versions of it on drive. \[describes bypassing repositories and using these downloaded wheels directly\].
  * “Fucking hell.” Perfectly sums up my experience with python and torch as well.

At this point I stopped looking, but I think it’s fair to say people *are* struggling with the current situation, and those people *are* pip’s users as well. I think they don’t typically associate it as a problem with pip, but as a problem with the given library they’re trying to install since pip generally works fine for them for every other kind of library they’re trying to install.

---

## Post #186 by rgommers

**Created:** 2025-08-19T02:22:50.523Z  
**Replies:** 0 | **Reads:** 107

@tgamblin I understand exactly what you’re asking and why, and could write an essay-length response, but I’m afraid that it’s going to raise even more questions from others who aren’t as deep into this stuff as you are. So I’ll keep it to some essential points here; we may want to jump on a call to talk through some of this and how this will relate to Spack possibly consuming wheels in the future, and if and how that may need to be addressed in design and/or PEP, or summarized for the audience on this thread.

Re BLAS: please have a look at the first figure on https://pypackaging-native.github.io/key-issues/native-dependencies/blas_openmp/ . The “wheels vendor a BLAS library” isn’t assumed/required to change with wheel variants (it could, but unvendoring is an orthogonal topic/choice to which BLAS library is used at build time). To do that, we’d indeed either need a BLAS *package* which acts as a mutex somehow that guarantees uniqueness (like `conda-forge`), or direct support in the resolver for achieving the same (like Spack’s `+blas`), rather than only a variant property. In this design/PEP, we definitely cannot say or prescribe anything for resolvers in this regard. And a package can be written, but there’s no mutex concept nor an `OR` operator in the grammar for dependencies to express something like `blas_impl_mkl OR blas_impl_openblas OR blas_impl_accelerate`). 

Also note that we actually do have OpenBLAS wheels (`scipy-openblas32`/`scipy-openblas64` packages) on PyPI. But we’re not using them as runtime dependencies, yet at least, only as a distribution mechanism to consume as a build-dependency. That is an orthogonal topic to wheel variants. I’d really rather not dive deeper into that here - that gets us back to https://discuss.python.org/t/enforcing-consistent-metadata-for-packages/50008 . 

[quote="tgamblin, post:180, topic:102383"]
Unification is key for C++ and many other compiled languages– it’s what keeps you from violating the one definition rule, and it’s what keeps your ABI consistent.

[/quote]

ABI consistency is a broader example of the need for uniqueness, but otherwise similar to BLAS. We don’t tackle that, and my take is that it’s inherently unsolvable since that’s just not how PyPI and wheels work, see https://pypackaging-native.github.io/meta-topics/pypi_social_model/ . Spack, Conda, Linux distros, etc. all solve this problem in very different ways but do all end up with a consistent set of packages leaning on shared libraries. PyPI/wheels do not, they “solve” it by hiding the ABI and vendoring the shared libraries. Trying to change that requires things like mutable metadata, being able to rebuild packages in a centralized fashion, and other such topics that are each individually very hard and/or already vetoed by this community multiple times in the past (often for good, PyPI-specific, reasons).

---

## Post #187 by mgorny

**Created:** 2025-08-19T03:44:41.339Z  
**Replies:** 0 | **Reads:** 100

[quote="pf_moore, post:176, topic:102383"]
To expand a little more, the evidence I’d want to see is issues raised by *pip users*, ideally on the pip tracker, that showed that missing functionality in pip in this area is making things harder for them. Right now, as far as I can see this is a non-issue on the pip tracker

[/quote]

To be honest, I don't really see why it would be. Users who are less versed in the ways of Python packaging are more likely to seek help on PyTorch support forums, etc. — after all, they wanted to install PyTorch, and they're having a problem with that. Users who are more versed realize this is an ecosystem problem, not a pip problem.

---

## Post #188 by mgorny

**Created:** 2025-08-19T03:48:45.044Z  
**Replies:** 0 | **Reads:** 103

[quote="dstufft, post:185, topic:102383"]
One part of that is the proliferation of “variant” packages on PyPI. If we look at the [PyPI stats page](https://pypi.org/stats/) , we can see a lot of `-gpu`, `-cpu`, `-cuNN`, `-rocm`, `-intel`, etc.

[/quote]

This also touches on my pet peeve: it further encourages publishing multiple packages that install the same files and overwrite one another. This is bad for security (think malicious leaf packages overwriting commonly used dependencies), and usually for UX too (installed files depending on installation order). And it seems to have reached the “normal way of doing things“ status on PyPI.

---

## Post #189 by pf_moore

**Created:** 2025-08-19T07:25:41.544Z  
**Replies:** 2 | **Reads:** 102

[quote="Carol Willing, post:184, topic:102383, username:willingc"]
From the bottom of my heart, the past 2 years have given me hope that we can create packaging standards that go beyond being tool-centric.
[/quote]

I have a feeling that my comments are being taken out of context here. It’s important to realise that the sub-thread that started this was based on my insistence that the PEPs need to specify required installer behaviour, and not leave it to tools to decide how to support an abstract wheel variant mechanism. I was explaining why, as a pip maintainer, I don’t feel qualified to make such decisions.

In the ecosystem context, I 100% understand that this is an important problem that needs to be solved. And with my PEP delegate hat on, I want to see it solved. But I’m strongly of the belief that in order to solve it, we have to state explicitly what the user experience will be for all installation scenarios, regardless of which tool the user is using.

---

## Post #190 by willingc

**Created:** 2025-08-19T16:21:16.003Z  
**Replies:** 0 | **Reads:** 105

> In the ecosystem context, I 100% understand that this is an important problem that needs to be solved. And with my PEP delegate hat on, I want to see it solved. But I’m strongly of the belief that in order to solve it, we have to state explicitly what the user experience will be for all installation scenarios, regardless of which tool the user is using.

Thanks for clarifying your agreement that this is a significant problem. On reading the comments, I felt that the importance was being questioned, not just by you but by others as well. I’m glad that we have common ground here.

Do we have to state the user experience for all installation scenarios explicitly? Or is it sufficient to state what the expected result should be if the standard is followed?

> I have a feeling that my comments are being taken out of context here. It’s important to realise that the sub-thread that started this was based on my insistence that the PEPs need to specify required installer behaviour, and not leave it to tools to decide how to support an abstract wheel variant mechanism. I was explaining why, as a pip maintainer, I don’t feel qualified to make such decisions.

Thanks for explaining this vital point that, as a pip maintainer, you don’t feel qualified to make decisions about how pip would support an abstract wheel variant mechanism. If I’m understanding your words correctly (writing is more challenging than speaking in person): we, the packaging community, need to provide better rules for “if an abstract wheel variant is used, then what is the expected result (independent of which tool is used)”.

I feel this thread may be overfocusing on the “how” at the expense of building more common understanding of the “what”.

Thanks @pf_moore for sharing your thoughts. It definitely helped me toward understanding your perspective. :sunny:

---

## Post #191 by Liz

**Created:** 2025-08-19T16:59:19.726Z  
**Replies:** 0 | **Reads:** 109

[quote="Paul Moore, post:189, topic:102383, username:pf_moore"]
In the ecosystem context, I 100% understand that this is an important problem that needs to be solved. And with my PEP delegate hat on, I want to see it solved. But I’m strongly of the belief that in order to solve it, we have to state explicitly what the user experience will be for all installation scenarios, regardless of which tool the user is using.
[/quote]

Not for nothing, but if this behavior is standardized, rather than left up to per tool behavior, it significantly helps address my concerns about user expectations and ensuring existing use cases remain valid, but it would require continuing to value things people have put a lot of effort into.

There are at least 3 things in opposition to each other here.

1. Some people want this to be automatic.
2. Some people want static resolution for multiple reasons.
3. The same people that want it to be automatic don't seem open to standardizing enough static info to preserve use cases other than theirs.

There's really not much room to bend on static resolution. It either is or isn't static, and it being static or not has a direct impact on both security posture and methods for reproducibility. Whether people think this is only for the "high security" use case or not, it does also impact tools meant for static analysis because it changes where arbitrary execution happens.

If it's expected that variant selectors must have stable behavior when run on the same host system, then there is no reason this needs to involve downloading code to happen other than trading convenience *for some use cases* against reproducibility and security concerns. All of the characteristics that variants are allowed to select using should be possible to standardize.

It's also not possible to be sure that users are aware their tools are changing ahead of time, and even if some are, how does someone write a script that works today and on whatever future version they need different behavior? Current tools reject flags they don't know about, and the user would need to know the flags in advance.

I'm fine with it being automatic and static.
I'm fine with it being opt-in, and require agreeing to run a selector, otherwise requiring the user specify (The default without either opt-in or specifying being to error informing the user of what they need to do.)
I'm not fine with it being automatic and running a selector automatically.

It seems like standardizing on what people can select on is the easiest way to still solve the hardware specialization use case, while also continuing to acknowledge existing use cases, but there are other ways to preserve existing use cases.

---

## Post #192 by ncoghlan

**Created:** 2025-08-19T19:34:14.687Z  
**Replies:** 1 | **Reads:** 102

[quote="Paul Moore, post:171, topic:102383, username:pf_moore"]
I should note with the second example that the standards allow two distinct wheels for the same version of a package to have different metadata (including dependencies). I believe that uv makes a simplifying assumption that this doesn’t happen in practice, and while I agree that’s a sensible engineering tradeoff for a tool to make, it’s *not* something we can do in a standard.
[/quote]

This reminded me of one of the main answers to the question "Why introduce wheel variants as a new concept, instead of publishing multiple projects?"

One of the constraints on wheel variants is that unlike separately named projects (and even formally unlike wheels for different platforms), variants of a wheel are all required to declare the same dependencies.

---

## Post #193 by steve.dower

**Created:** 2025-08-19T19:39:02.610Z  
**Replies:** 1 | **Reads:** 99

[quote="Alyssa Coghlan, post:192, topic:102383, username:ncoghlan"]
One of the constraints on wheel variants is that unlike separately named projects (and even formally unlike wheels for different platforms), variants of a wheel are all required to declare the same dependencies.
[/quote]

This sounds like a restriction we'd come to regret, or more likely, a number of publishers will force themselves to work around it and we'll never hear about their issues until it's so embedded that it can't be changed.

It seems pretty obvious that some variants are going to need different dependencies? This limitation would make unbundling OpenBLAS from numpy/scipy probably impossible (or highly complicated, as I mentioned).

---

## Post #194 by notatallshaw

**Created:** 2025-08-19T19:57:07.474Z  
**Replies:** 2 | **Reads:** 111

[quote="steve.dower, post:193, topic:102383"]
This sounds like a restriction we’d come to regret, or more likely, a number of publishers will force themselves to work around it and we’ll never hear about their issues until it’s so embedded that it can’t be changed.

[/quote]

I’m pretty sure universal resolvers are going to require that the wheels variants have the same dependencies for them to work well.

[quote="steve.dower, post:193, topic:102383"]
It seems pretty obvious that some variants are going to need different dependencies? This limitation would make unbundling OpenBLAS from numpy/scipy probably impossible (or highly complicated, as I mentioned).

[/quote]

Currently for different platforms universal resolvers require the wheels to use [environment markers](https://packaging.python.org/en/latest/specifications/dependency-specifiers/#environment-markers) to express when different requirements need different dependencies to work well with universal resolution.

I assume the same will be true for variants, and environment markers appear to be part of the propsal: https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#variant-environment-markers

---

## Post #195 by steve.dower

**Created:** 2025-08-19T20:15:07.983Z  
**Replies:** 1 | **Reads:** 112

[quote="Damian Shaw, post:194, topic:102383, username:notatallshaw"]
Currently for different platforms universal resolvers require the wheels to use [environment markers](https://packaging.python.org/en/latest/specifications/dependency-specifiers/#environment-markers) to express when different requirements need different dependencies to work well with universal resolution.
[/quote]

An environment marker that can't be resolved until a variant is selected may as well be independent metadata.

And an environment marker that _can_ be resolved prior to selecting a variant means the installer must have prior knowledge of all possible variant dimensions and values.

I think we'll regret the first case (for being unnecessarily complicated), and regret the second case (for putting too much burden on the installer).

---

## Post #196 by dstufft

**Created:** 2025-08-19T20:35:13.670Z  
**Replies:** 2 | **Reads:** 114

[quote="notatallshaw, post:194, topic:102383"]
Currently for different platforms universal resolvers require the wheels to use [environment markers](https://packaging.python.org/en/latest/specifications/dependency-specifiers/#environment-markers) to express when different requirements need different dependencies to work well with universal resolution.

I assume the same will be true for variants, and environment markers appear to be part of the propsal: [Wheel Variant Support - WheelNext](https://wheelnext.dev/proposals/pepxxx_wheel_variant_support/#variant-environment-markers)

[/quote]

Unless my brain isn’t working correctly (which is possible!) I don’t think you can universally resolve dependencies if variants are in play?

Existing environment markers are effectively immutable for a given target, but the same isn’t true for variants.

It appears the proposal tries to get around this by having the environment markers evaluate against the variant data from within the wheel– but that also seems wrong to me? A single wheel artifact may be able to handle any of multiple axis of variation, but the system itself may only be able to support a single of those options.

This might be a wrong example, but I imagine you could have a wheel that works for cu10, cu11, and cu12 (using dynamic dispatch or something), so it would satisfy the variants for all 3 of those within the wheel itself. However, the system itself might only support cu11, and if that wheel needs to depend on a different dependency based on whether cu10, cu11, or cu12 is being selected… they just can’t?

TBH having the environment markers use the contents of the file selected feels very off to me (at that point it’s no longer an “environment” marker anymore, since the artifact isn’t part of the environment) and feels like a violation of what environment markers *are*.

---

## Post #197 by notatallshaw

**Created:** 2025-08-19T20:36:18.355Z  
**Replies:** 1 | **Reads:** 110

[quote="steve.dower, post:195, topic:102383"]
An environment marker that can’t be resolved until a variant is selected may as well be independent metadata.

And an environment marker that *can* be resolved prior to selecting a variant means the installer must have prior knowledge of all possible variant dimensions and values.

[/quote]

I’m not sure how this affects the case of universal resolution?

For example if I have a platform marker now in a requirements file:

```
foo
bar; platform_system == "Windows"
```

Universal resolution doesn’t need to “resolve” that environment marker, it can fork the resolution so that bar, and all of bar’s dependencies and transitive dependencies include the marker `platform_system == "Windows"`, and then it merges the forks at the end of resolution.

How would that change with variants as part of environment markers? Maybe I’m missing something about this proposal.

---

## Post #198 by steve.dower

**Created:** 2025-08-19T20:45:37.180Z  
**Replies:** 1 | **Reads:** 108

[quote="Damian Shaw, post:197, topic:102383, username:notatallshaw"]
I’m not sure how this affects the case of universal resolution?
[/quote]

Okay, fair, it probably doesn't (it just massively bloats the solution). _Universal_ resolution is something that I've never had need to care about, so I tend to need it to be mentioned twice before I catch on that we're not doing a specific resolve ;)

Any PEP is going to need a fully worked through example of both how the resolver will solve this, and how an installer will interpret the solution in light of the reality of the system it's installing into. If only to show that the process (and implicitly, the debugging of failures of the process) is of reasonable complexity.

---

## Post #199 by pf_moore

**Created:** 2025-08-19T21:20:45.285Z  
**Replies:** 0 | **Reads:** 113

[quote="Steve Dower, post:198, topic:102383, username:steve.dower"]
Any PEP is going to need a fully worked through example of both how the resolver will solve this, and how an installer will interpret the solution in light of the reality of the system it’s installing into.
[/quote]

I will note that universal resolution is far from being a well-understood concept anyway. Pip doesn't do universal resolution at all, and from what I recall of the lockfile discussions, the tools that do didn't particularly agree on the process either (some needed a resolver at install time, others didn't). Maybe now we have lockfiles that standardise what it means for a lock (resolution) to apply to multiple environments, things are clearer? I haven't been keeping up with how tools have implemented the new standard lockfile.

That's not to say it *can't* be well defined, just that if we want to ensure that users get the same results regardless of what tool they use (and that feels to me like it should be self-evidently a minimum requirement) then we're getting into very murky territory.

Actually, this leads on to another question, because a universal resolution generates a lockfile, and the lockfile format was explicitly designed to impose minimal complexity on a compliant installer (not needing a resolver was a key example of this). But the lockfile standard requires that selection of packages to install is done *purely* using environment markers. I don't see how wheel variants will fit into that - and indeed the linked proposal document notes that lockfiles are still an open issue. I'd be concerned if adding wheel variants into the lockfile spec meant that we now needed a bunch of complexity around running selectors, managing environments to install those selectors into, etc. Because this would violate the lockfile design principle of being installable with simple installation tools.

---

## Post #200 by mgorny

**Created:** 2025-08-20T06:00:22.609Z  
**Replies:** 1 | **Reads:** 112

[quote="dstufft, post:196, topic:102383"]
This might be a wrong example, but I imagine you could have a wheel that works for cu10, cu11, and cu12 (using dynamic dispatch or something), so it would satisfy the variants for all 3 of those within the wheel itself. However, the system itself might only support cu11, and if that wheel needs to depend on a different dependency based on whether cu10, cu11, or cu12 is being selected… they just can’t?

[/quote]

I admit that there are probably valid use cases for what you’re proposing. However, the proposal focused on the specific use cases we had at hand, and these use cases were focused around defining dependencies per specific variant wheel rather than per arbitrary data from provider plugin.

Think of it like this: if NumPy didn’t link statically, the OpenBLAS variant would have a dependency on `scipy-openblas`, and mkl variant would have a dependency on `mkl`. Technically, both variants are supported, but you only need the dependency for the variant you’re installing, and asking people to do enumerations like `”blas::variant::openblas” in variant_properties and not “blas::variant::mkl” in variant_properties and not …` is not really good UX.

---

## Post #201 by dstufft

**Created:** 2025-08-20T16:16:54.617Z  
**Replies:** 2 | **Reads:** 111

[quote="mgorny, post:200, topic:102383"]
I admit that there are probably valid use cases for what you’re proposing. However, the proposal focused on the specific use cases we had at hand, and these use cases were focused around defining dependencies per specific variant wheel rather than per arbitrary data from provider plugin.

[/quote]

So arguably there’s an inherent mechanism for dealing with dependencies for a specific variant wheel given that dependency metadata is per artifact (and I’d argue that any solver that can’t handle that is at least somewhat broken).

There’s no mechanism for dealing with dependencies that depend on the *properties* of the system unless you strictly limit yourself to one axis per artifact (and again, that would depend on solvers being able to handle artifacts having different dependencies).

---

## Post #202 by rgommers

**Created:** 2025-08-20T20:08:27.573Z  
**Replies:** 0 | **Reads:** 105

[quote="sirosen, post:153, topic:102383"]
Selectors seem reminiscent of build backends. Which is a system which works pretty well, but has some points of friction which I’d like the PEP authors to think about.

[/quote]

Thank you @sirosen, those were insightful questions. Most of your questions require some in-depth discussion or experimentation, so I opened an issue at [pep_xxx_wheel_variants#71](https://github.com/wheelnext/pep_xxx_wheel_variants/issues/71) with some initial thoughts and to capture that we have homework to do to ensure there’s a good story here.

---

## Post #203 by notatallshaw

**Created:** 2025-08-20T21:54:18.627Z  
**Replies:** 3 | **Reads:** 106

[quote="dstufft, post:201, topic:102383"]
dependency metadata is per artifact (and I’d argue that any solver that can’t handle that is at least somewhat broken).

[/quote]

You should take that up with uv and Poetry then that by design assume dependency metadata is fully expressed, and identical, across a whole release in each artifact.

---

## Post #204 by tgamblin

**Created:** 2025-08-20T23:32:30.657Z  
**Replies:** 2 | **Reads:** 104

[quote="notatallshaw, post:203, topic:102383"]
You should take that up with uv and Poetry then that by design assume dependency metadata is fully expressed, and identical, across a whole release in each artifact.

[/quote]

Does pip also assume this? Or is this just something that’s currently not agreed on between packaging tools?  FWIW I agree with @dstufft and would hope that this isn’t a hard restriction.

---

## Post #205 by bwoodsend

**Created:** 2025-08-20T23:40:12.805Z  
**Replies:** 0 | **Reads:** 103

No, pip doesn't. It's one of the less savoury places where `uv` gets its speed.

---

## Post #206 by notatallshaw

**Created:** 2025-08-21T00:14:32.041Z  
**Replies:** 1 | **Reads:** 107

[quote="tgamblin, post:204, topic:102383"]
Does pip also assume this?

[/quote]

Pip doesn’t, at least yet, do universal resolution, so it has no incentive to do this.

[quote="tgamblin, post:204, topic:102383"]
FWIW I agree with @dstufft and would hope that this isn’t a hard restriction.

[/quote]

I’m pretty sure it is, it’s not just about performance but doing a universal resolution in a sane way. It’s important to discuss with uv and Poetry maintainers.

---

## Post #207 by mgorny

**Created:** 2025-08-21T05:45:43.847Z  
**Replies:** 0 | **Reads:** 108

[quote="notatallshaw, post:203, topic:102383"]
You should take that up with uv and Poetry then that by design assume dependency metadata is fully expressed, and identical, across a whole release in each artifact.

[/quote]

This somewhat reminds me of the old anti-pattern of:

```
install_requires = []
if sys.version_info < ...:
    install_requires += [...]
```

This is somewhat tangential to the discussion of variants but I certainly wouldn’t mind more aggressively pushing against that. I think both wheel tags and variants are fully covered by environment markers, aren’t they?

---

## Post #208 by dstufft

**Created:** 2025-08-21T14:44:05.692Z  
**Replies:** 2 | **Reads:** 110

[quote="notatallshaw, post:203, topic:102383"]
You should take that up with uv and Poetry then that by design assume dependency metadata is fully expressed, and identical, across a whole release in each artifact.

[/quote]

[quote="notatallshaw, post:206, topic:102383"]
I’m pretty sure it is, it’s not just about performance but doing a universal resolution in a sane way. It’s important to discuss with uv and Poetry maintainers.

[/quote]

I talked with the `uv` maintainers yesterday and it does not sound like it is a hard restriction, but rather one done to make the universal solve happen in a reasonable amount of time and to minimize complexity. Currently their resolver treats versions as the “nodes” in the system, but they could treat the artifact as the “nodes”– that would just require fetching the metadata of a lot more artifacts (\~75 per version of numpy for instance), so it would be a lot slower.

It’s not really specifically related to variants, but as it stands we’re kind of in the worst of all worlds. What `uv` and `poetry` etc make is a simplifying assumption, which is fine, but the specs do *not* make that assumption, so the specs have to be designed with that in mind, both in terms of situations they have to handle and in terms of what makes them as logically consistent with each other as possible.

My understanding is that it does keep cropping up for `uv` that projects don’t have consistent metadata, which gets solved by opening up tickets on those projects and asking them to please not do that. Which is kinda crummy because we have this thing that is fully legal, but if you use it you’re going to get push back due to limitations in some people’s chosen installer.

We should probably figure something out at some point, either to require consistent metadata *or* to adjust the simple API such that `uv` and such can handle inconsistent metadata without degraded performance. I don’t personally have a strong opinion on which of those options we choose, and that’s not really a question for this spec anyways.

What I think *is* a question for this spec, is ensuring that it remains consistent with the overall landscape, which currently is such that you can have per wheel dependencies (and other metadata), so I personally think that variants should also allow that.

[quote="dstufft, post:196, topic:102383"]
It appears the proposal tries to get around this by having the environment markers evaluate against the variant data from within the wheel– but that also seems wrong to me? A single wheel artifact may be able to handle any of multiple axis of variation, but the system itself may only be able to support a single of those options.

[/quote]

[quote="dstufft, post:196, topic:102383"]
TBH having the environment markers use the contents of the file selected feels very off to me (at that point it’s no longer an “environment” marker anymore, since the artifact isn’t part of the environment) and feels like a violation of what environment markers *are*.

[/quote]


I do want to call this out though. In talking with the folks proposing variants, it appears that my reading of the proposal was wrong. My new understanding is that the environment markers are not just evaluating against the variants encoded in the wheel and ignoring the variants the system supports, but rather are evaluated against the intersection of what is in the wheel and what comes from the system.

I think that makes sense, and while it’s still *different* than how the other environment markers work technically, I think that it matches how they work in spirit, and I think is good enough for me personally. 

I believe as part of taking the current draft proposal and turning it into an actual PEP, they’ll be clarifying the wording here to make that more obvious.

---

## Post #209 by notatallshaw

**Created:** 2025-08-21T15:20:42.356Z  
**Replies:** 1 | **Reads:** 109

[quote="dstufft, post:208, topic:102383"]
Currently their resolver treats versions as the “nodes” in the system, but they could treat the artifact as the “nodes”– that would just require fetching the metadata of a lot more artifacts (\~75 per version of numpy for instance), so it would be a lot slower.

[/quote]

And to be clear it’s not just that there will be 75 nodes, requiring 75x more look ups, but it’s also a question about how does the resolver handle this.

When you use an environment marker to fork a universal resolution that just creates two resolutions have to be completed and then merged at the end. If you have 75 different platforms you have to start asking questions like:

* Do I limit the requirement to the 75 platforms listed? 
* If so how do I express that in the output?
* Do I fork 75 times or so I try and merge them in some way?
* Or if all the requirements are the same do I assume that the requirements are the same for all the platforms? Even if the sdist could technically build something different for a wheel not pre-built

Optimizing for the best UX for the common case will lead to edge cases for non-common cases, and being strictly spec compliant will reduce edge cases but be hard to present a good UX for common cases.

---

## Post #210 by brettcannon

**Created:** 2025-08-22T17:38:19.271Z  
**Replies:** 1 | **Reads:** 102

[quote="dstufft, post:208, topic:102383"]
We should probably figure something out at some point, either to require consistent metadata *or* to adjust the simple API such that `uv` and such can handle inconsistent metadata without degraded performance.

[/quote]

That should probably be a separate topic.

---

## Post #211 by h-vetinari

**Created:** 2025-08-22T22:56:45.979Z  
**Replies:** 0 | **Reads:** 100

[quote="Damian Shaw, post:209, topic:102383, username:notatallshaw"]
And to be clear it’s not just that there will be 75 nodes, requiring 75x more look ups, but it’s also a question about how does the resolver handle this.
[/quote]

Wouldn't it be trivial to merge those nodes based on whether the have the exact same dependency metadata? That would maintain the current fast path if all nodes _actually_ have the same dependencies, and would split appropriately into the minimal set of 2, 3 or X different combinations of dependencies where necessary.

---

## Post #212 by jonathandekhtiar

**Created:** 2025-08-23T23:24:25.586Z  
**Replies:** 1 | **Reads:** 102

I've been encouraging @charliermarsh and his team to formalize this in a PEP.

Effectively 99.9(insert probably a few 9)% of the wheels do share identical dependencies.

Though if it's something important enough for a significant percentage of the community (and if we accumulate poetry & uv, it quite definitely is), we should take a stab at standardizing this. 

Though agreed with Brett, it's a discussion for a different thread.

-----

Now to answer on the standard we will be proposing, what is said above is correct. We will introduce "variant selectors" for each level (namespace / feature name / value) and these will be matched against the metadata of the wheel itself.

This allows us to not only break the assumption of identical dependencies accross a release (why break something if we don't have to) and provide an easy to manage variant specific dependencies without having to dynamically define dependencies which could become a headache depending on the build matrix.

I quite sincerely this approach is the best in-between of all the solutions possibles. Though happy to reconsider if someone has a better idea

---

## Post #213 by aragilar

**Created:** 2025-08-24T03:12:37.750Z  
**Replies:** 1 | **Reads:** 97

Are there any expectations around how installers should handle where either the system changes (e.g. replacing a GPU) or where the build/install system is different to the runtime system (e.g. building OCI or singularity containers in CI)? Dynamic dispatch would reduce both these issues (assuming a fallback option that worked on any system expressible by current wheel tags was installable), and means most users wouldn’t need to know the details of how the dynamic dispatch works.

---

## Post #214 by aragilar

**Created:** 2025-08-24T03:22:23.485Z  
**Replies:** 1 | **Reads:** 97

Doesn’t this assume that there are no additional wheels produced at a later point which are uploaded to support new variants, which will need new metadata?

---

## Post #215 by jonathandekhtiar

**Created:** 2025-08-24T03:24:27.333Z  
**Replies:** 1 | **Reads:** 104

[quote="James Tocknell, post:213, topic:102383, username:aragilar"]
Are there any expectations around how installers should handle where either the system changes (e.g. replacing a GPU)?
[/quote]

Exactly the way it currently works. Zero expectation. If you change something related to your OS (today) or upgrade Python or anything, there's a good chance your install will break and you will have to re-install.

Well it will be exactly the same. Hopefully "hardware" is probably less likely to be a fast moving parameters than software components: `sudo apt upgrade -y gpu` :heart_eyes: I wish ... But no :D 

And I believe it's important that we don't break that assumption. It both be a total nightmare to implement, and a complete overall of installer logic.

So: Nope !

[quote="James Tocknell, post:213, topic:102383, username:aragilar"]
where the build/install system is different to the runtime system (e.g. building OCI or singularity containers in CI)
[/quote]

We will have a section in the PEP about containers. Because it's precisely a usecase where the hardware will rarely match between builders/consumers.

[quote="James Tocknell, post:213, topic:102383, username:aragilar"]
Dynamic dispatch would reduce both these issues (assuming a fallback option that worked on any system expressible by current wheel tags was installable), and means most users wouldn’t need to know the details of how the dynamic dispatch works.
[/quote]

This PEP is designed in large part to stop "dynamic dispatch" being the only possible answer. It has so many problems ... One of them you can't force everybody to do it => so that will never work :) 

[quote="James Tocknell, post:214, topic:102383, full:true, username:aragilar"]
Doesn’t this assume that there are no additional wheels produced at a later point which are uploaded to support new variants, which will need new metadata?
[/quote]

No, the metadata are hardcoded inside the wheel themselves. If you publish a new wheel it doesn't change anything, can include different metadata.

Check this webpage: https://variants-index.wheelnext.dev/numpy/

It's a good "visual representation" of what these metadata are.

---

## Post #216 by aragilar

**Created:** 2025-08-24T03:37:23.132Z  
**Replies:** 3 | **Reads:** 104

Let’s say there’s a new amd64 baseline (v5) that comes out after I do my initial release, and one of my (external to the Python ecosystem) libraries adds support (internally, so no ABI changes) for the v5 baseline. Can I not build a new wheel (making no changes to the source package) and it will produce a new variant? And a package depending on my package decides to do a new build on top of my new build as well, and so there must be new metadata there for the selectors?

---

## Post #217 by jamestwebber

**Created:** 2025-08-24T04:08:09.664Z  
**Replies:** 1 | **Reads:** 104

I'm guessing the order this happens is:

0. A fancy new CPU is released
1. the plugin^[or "a plugin", possibly there could be different options] that chooses CPU variants is updated to support the new architecture
2. you build a new wheel that requires the new variant because you're using some fancy new CPU feature^[if you aren't I don't think you need to do anything?]
    * presumably you make a new release because you've added features to your code
3. people that depend on your package don't need to care--users will get the best variant for them

If this happens to one of your dependencies, and you haven't set a max version for your package^[assuming everyone is playing nice with regards to backwards compatibility], I don't think you do anything--users install your package, and the installers should resolve to whatever the best variant of the dependencies are for them.

---

## Post #218 by aragilar

**Created:** 2025-08-24T04:53:05.409Z  
**Replies:** 0 | **Reads:** 104

I explicitly called out making no changes to the code in my example (it was a separate library, but it could be a complier gaining new optimisations). The point being, you either hardcode the metadata and you can’t reflect changes outside your package which affect your package, or such metadata is autogenerated (which is likely the smarter route, less chances for errors) and then an ecosystem change must end up modifying the metadata. Hence variants do not solve the “metadata must be the same across wheels and correct” problem. PyPI could always require that wheels have the same metadata, but that doesn’t mean that installers can ignore other sources of wheels.

---

## Post #219 by jonathandekhtiar

**Created:** 2025-08-24T05:18:14.529Z  
**Replies:** 1 | **Reads:** 106

[quote="James Tocknell, post:216, topic:102383, full:true, username:aragilar"]
Let’s say there’s a new amd64 baseline (v5) that comes out after I do my initial release, and one of my (external to the Python ecosystem) libraries adds support (internally, so no ABI changes) for the v5 baseline. Can I not build a new wheel (making no changes to the source package) and it will produce a new variant? And a package depending on my package decides to do a new build on top of my new build as well, and so there must be new metadata there for the selectors?
[/quote]

Well right now - nothing stops from you doing that and this proposal won't prevent you to do that.
Now - I personally think it's not a great idea to go back to previous releases and change stuff (even if it's just including a new platform / variant).

But really, as the package maintainer you can do this and nothing is stopping you.
You will probably break `uv` and `poetry`, but that's your decision ;) 

If you think about it - there's nothing specific to this proposal to the scenario you propose...

You release in January version `1.2.3` of your package with only Linux support.
In July, you decide to go back and add `Windows` support to the `1.2.3` release and that includes new `windows-only` dependencies. 

The only rule - at least on PyPI.org - is that files are immutable. You can't go back and update them. As long as you don't do that - frankly, everything is fair game (though not necessarily a good idea ...)

Exact same scenario: supported today, supported after this PEP.
Should you do that: IMHO no - but that's a different debate.

---

## Post #220 by mgorny

**Created:** 2025-08-24T07:01:35.263Z  
**Replies:** 1 | **Reads:** 100

[quote="aragilar, post:216, topic:102383"]
Can I not build a new wheel (making no changes to the source package) and it will produce a new variant? And a package depending on my package decides to do a new build on top of my new build as well, and so there must be new metadata there for the selectors?

[/quote]

You can, and if you indeed indicate that this is v5 baseline variant, then indeed it will have the metadata saying so. However, depending on the index implementation, you may not be able to update the `*-variants.json` file to expose the new wheel.

I don't really understand what problem do you see here.

---

## Post #221 by aragilar

**Created:** 2025-08-24T14:01:01.555Z  
**Replies:** 0 | **Reads:** 105

[quote="jonathandekhtiar, post:219, topic:102383"]
You release in January version `1.2.3` of your package with only Linux support.
In July, you decide to go back and add `Windows` support to the `1.2.3` release and that includes new `windows-only` dependencies.

[/quote]

Presumably this requires making some changes to the code? I’m imaging simply compiling with a newer GCC/clang would be enough to cause issues. There’s nothing preventing someone from uploading that wheel somewhere (or simply asking the maintainers to do it), and so while maybe PyPI may provide additional constraints, that does not mean installers can ignore the existence of said wheels.

Side note: there seems to be a number of implicit but core assumptions/visions around how the ecosystem is expected to behave in the future which are embedded within this PEP (the execution of the variant selectors being opt-out, identical wheel metadata and now unchangeable/frozen releases are the ones I’ve noted), perhaps they should be pulled out and discussed separately, because I’m getting the vibe that there is consensus within the WheelNext group on these (maybe?), but that there isn’t consensus outside of it? I feel like these should be sorted out first, given they would appear to be more structural changes?

---

## Post #222 by aragilar

**Created:** 2025-08-24T14:13:01.935Z  
**Replies:** 1 | **Reads:** 116

But therefore the metadata is not the same as the older wheels, right? Hence you cannot assume all wheels have the same metadata.

On indices, given caching tools like devpi allow merging multiple indices, how should the merging of the variants files work? I would imagine you perform the union of them, but that would mean the one served out of the index wouldn’t actually be any of the ones in the wheels.

---

## Post #223 by mgorny

**Created:** 2025-08-24T15:16:03.723Z  
**Replies:** 0 | **Reads:** 117

[quote="aragilar, post:222, topic:102383"]
But therefore the metadata is not the same as the older wheels, right? Hence you cannot assume all wheels have the same metadata.

[/quote]

Let's clarify a bit. “Variant information“ is entirely separate from Core Metadata. The latter will be the same, unless you explicitly changed it. Only the former will change, and there's no immutability requirement there. After all, by design the variant information must be different in every variant.

[quote="aragilar, post:222, topic:102383"]
On indices, given caching tools like devpi allow merging multiple indices, how should the merging of the variants files work? I would imagine you perform the union of them, but that would mean the one served out of the index wouldn’t actually be any of the ones in the wheels.

[/quote]

Generally, merging `variants.json`implies merging the dictionary containing the list of variants, so I imagine it would be the same here. They're never the same, because the wheel contains only its own variant properties, whereas the index needs to have all the variants served.

---

## Post #225 by notatallshaw

**Created:** 2025-10-02T22:00:32.854Z  
**Replies:** 1 | **Reads:** 95

Variants were recently brought up in a [pip issue](https://github.com/pypa/pip/issues/13608), and I would like to add something which in my mind was obvious, but apparently I had too many assumptions about this project:

* Variant plugins SHOULD only select wheel variant candidates on information that is known ahead of resolution, and not information that could change during the install resolution.

For example information that could be known ahead of time might be system libraries or hardware.

What they should not do is select candidates on versions of Python packages that are determined during the install resolution that they are themselves a part of.

For example, we should not have a scenario where you have a numpy variant plugin that selects candidates based of other projects, e.g. `foo` has wheels variants for numpy 2.0, 2.1, and 2.2, when the version of numpy itself might change during the resolution, say to 1.4 because of some other transitive dependency.

If this feature of selecting wheel variants based on other Python package versions installed is required, then somehow the variant plugin should express before the resolution some required constraint, such as `numpy=={installed version}` which would be materialized before resolution to something like `numpy==2.2`, or simply just a fixed version the user somehow selects. I do not know how this would work in the variant flow, but I can’t think of any other reasonable solution for this feature.

---

## Post #226 by notatallshaw

**Created:** 2025-10-03T01:08:42.144Z  
**Replies:** 0 | **Reads:** 95

[quote="notatallshaw, post:225, topic:102383"]
Variants were recently brought up in a [pip issue](https://github.com/pypa/pip/issues/13608), and I would like to add something which in my mind was obvious, but apparently I had too many assumptions about this project:

* Variant plugins SHOULD only select wheel variant candidates on information that is known ahead of resolution, and not information that could change during the install resolution.

[/quote]

@konstin mentioned to me what was brought up in that issue is not part of the wheel variant proposal, so that’s great.

---

