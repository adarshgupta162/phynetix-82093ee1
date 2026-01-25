# LaTeX Guide for PhyNetix

This guide provides comprehensive documentation on using LaTeX, mathematical notation, and chemistry notation in PhyNetix questions and solutions.

## Table of Contents
- [Basic Math Notation](#basic-math-notation)
- [Chemistry Notation](#chemistry-notation)
- [Creating Tables](#creating-tables)
- [Limitations](#limitations)
- [Testing Examples](#testing-examples)

## Basic Math Notation

PhyNetix uses KaTeX for rendering mathematical expressions. You can use both inline and display math modes.

### Inline Math
Use single dollar signs `$...$` or `\(...\)` for inline math:
```
The quadratic formula is $ax^2 + bx + c = 0$
The energy equation is \(E = mc^2\)
```

### Display Math
Use double dollar signs `$$...$$` or `\[...\]` for centered display math:
```
$$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

\[\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}\]
```

## Chemistry Notation

PhyNetix includes the mhchem extension for KaTeX, allowing you to write chemical formulas and equations beautifully.

### Chemical Formulas

Use `\ce{...}` command for chemical formulas:

```
$\ce{H2O}$ - Water
$\ce{H2SO4}$ - Sulfuric acid
$\ce{CH3COOH}$ - Acetic acid
$\ce{NaCl}$ - Sodium chloride
$\ce{Ca(OH)2}$ - Calcium hydroxide
$\ce{Fe2O3}$ - Iron(III) oxide
```

### Chemical Equations

Write balanced chemical equations using `\ce{...}`:

```
$$\ce{CO2 + C -> 2CO}$$
$$\ce{2H2 + O2 -> 2H2O}$$
$$\ce{CaCO3 -> CaO + CO2}$$
$$\ce{CH4 + 2O2 -> CO2 + 2H2O}$$
```

### States of Matter

Indicate physical states using subscripts:

```
$\ce{H2O_{(l)}}$ - Liquid water
$\ce{NaCl_{(s)}}$ - Solid sodium chloride
$\ce{O2_{(g)}}$ - Gaseous oxygen
$\ce{Na+_{(aq)}}$ - Aqueous sodium ion
```

### Charges

Show ionic charges on atoms and molecules:

```
$\ce{Na+}$ - Sodium cation
$\ce{Cl-}$ - Chloride anion
$\ce{SO4^2-}$ - Sulfate ion
$\ce{NH4+}$ - Ammonium ion
$\ce{Fe^3+}$ - Iron(III) ion
```

### Isotopes

Write isotopes with mass numbers:

```
$\ce{^{14}C}$ - Carbon-14
$\ce{^{235}U}$ - Uranium-235
$\ce{^{2}H}$ or $\ce{D}$ - Deuterium
$\ce{^{3}H}$ or $\ce{T}$ - Tritium
```

### Reaction Arrows

Use various arrow types to show reaction directions:

```
$\ce{->}$ - Yields/produces
$\ce{<-}$ - Reverse arrow
$\ce{<=>}$ - Equilibrium
$\ce{<<=>}$ - Resonance
$\ce{<-->}$ - Reversible reaction
```

**Example with conditions:**
```
$$\ce{N2 + 3H2 ->[catalyst][heat] 2NH3}$$
$$\ce{A + B <=>[k1][k2] C + D}$$
```

### Physical Units

Use `\pu{...}` command for physical units with proper formatting:

```
$\pu{1.2 kg}$ - Mass
$\pu{25 °C}$ - Temperature
$\pu{100 kPa}$ - Pressure
$\pu{2.5 mol L-1}$ - Concentration
$\pu{9.8 m s-2}$ - Acceleration
```

### Complex Chemistry Examples

**Precipitation reaction:**
```
$$\ce{AgNO3_{(aq)} + NaCl_{(aq)} -> AgCl_{(s)} v + NaNO3_{(aq)}}$$
```

**Redox reaction:**
```
$$\ce{MnO4- + 8H+ + 5e- -> Mn^2+ + 4H2O}$$
```

**Organic reaction:**
```
$$\ce{CH3CH2OH ->[H2SO4][heat] CH2=CH2 + H2O}$$
```

## Creating Tables

KaTeX supports the `array` environment for creating tables. Note that the `tabular` environment is **not supported** in KaTeX.

### Basic Table Structure

Use the `array` environment within display math mode:

```latex
$$\begin{array}{|c|c|c|}
\hline
\text{Header 1} & \text{Header 2} & \text{Header 3} \\
\hline
\text{Row 1, Col 1} & \text{Row 1, Col 2} & \text{Row 1, Col 3} \\
\hline
\text{Row 2, Col 1} & \text{Row 2, Col 2} & \text{Row 2, Col 3} \\
\hline
\end{array}$$
```

### Column Alignment

- `l` - Left-aligned
- `c` - Center-aligned
- `r` - Right-aligned
- `|` - Vertical line separator

```latex
$$\begin{array}{lcr}
\text{Left} & \text{Center} & \text{Right} \\
1 & 2 & 3
\end{array}$$
```

### Chemistry Table Example

Periodic table excerpt:

```latex
$$\begin{array}{|c|c|c|c|}
\hline
\text{Element} & \text{Symbol} & \text{Atomic Number} & \text{Mass (amu)} \\
\hline
\text{Hydrogen} & \ce{H} & 1 & 1.008 \\
\hline
\text{Carbon} & \ce{C} & 6 & 12.01 \\
\hline
\text{Nitrogen} & \ce{N} & 7 & 14.01 \\
\hline
\text{Oxygen} & \ce{O} & 8 & 16.00 \\
\hline
\end{array}$$
```

### Physics Data Table

```latex
$$\begin{array}{|l|c|r|}
\hline
\text{Quantity} & \text{Symbol} & \text{Unit} \\
\hline
\text{Force} & F & \text{N} \\
\text{Energy} & E & \text{J} \\
\text{Power} & P & \text{W} \\
\text{Velocity} & v & \text{m/s} \\
\hline
\end{array}$$
```

## Limitations

### Not Supported in KaTeX

The following LaTeX features are **NOT** available in KaTeX:

1. **chemfig package** - For structural chemical diagrams
   - Cannot draw benzene rings, bond structures, etc.
   - **Workaround**: Use images for structural formulas

2. **TikZ/PGF** - For custom graphics and diagrams
   - **Workaround**: Create diagrams externally and include as images

3. **tabular environment** - Use `array` instead
   
4. **Complex packages** like:
   - `siunitx` (partial support via `\pu{}`)
   - `chemformula`
   - `chemmacros`

### Recommended Alternatives

For unsupported features:
- **Structural formulas**: Export as PNG/SVG from ChemDraw, MarvinSketch, or online tools
- **Complex diagrams**: Use tools like draw.io, Inkscape, or LaTeX-to-image converters
- **Consider MathJax**: If you need more advanced LaTeX features, consider switching from KaTeX to MathJax (though this comes with a performance trade-off)

## Testing Examples

### Example 1: Chemistry Question

**Question:**
```
Calculate the number of moles in 98 g of $\ce{H2SO4}$ (Molecular mass = $\pu{98 g mol-1}$).

$$\text{Number of moles} = \frac{\text{mass}}{\text{molar mass}}$$
```

### Example 2: Chemical Equation Balancing

**Question:**
```
Balance the following chemical equation:

$$\ce{C3H8 + O2 -> CO2 + H2O}$$

**Solution:**
$$\ce{C3H8 + 5O2 -> 3CO2 + 4H2O}$$
```

### Example 3: Equilibrium Problem

**Question:**
```
For the reaction $\ce{N2 + 3H2 <=> 2NH3}$, if the equilibrium constant $K_c = 0.5$ at $\pu{400 °C}$, 
calculate the equilibrium concentrations given initial concentrations of $[\ce{N2}] = \pu{1.0 M}$ and 
$[\ce{H2}] = \pu{3.0 M}$.
```

### Example 4: Redox with Table

**Question:**
```
Complete the following table for the redox reaction:

$$\ce{MnO4- + Fe^2+ + H+ -> Mn^2+ + Fe^3+ + H2O}$$

$$\begin{array}{|l|c|c|}
\hline
\text{Species} & \text{Oxidation State (Initial)} & \text{Oxidation State (Final)} \\
\hline
\ce{Mn} & +7 & +2 \\
\hline
\ce{Fe} & +2 & +3 \\
\hline
\end{array}$$
```

### Example 5: Mixed Math and Chemistry

**Question:**
```
The ideal gas law is given by:

$$PV = nRT$$

Where:
- $P$ is pressure in $\pu{Pa}$
- $V$ is volume in $\pu{m3}$
- $n$ is number of moles
- $R = \pu{8.314 J K-1 mol-1}$ (gas constant)
- $T$ is temperature in $\pu{K}$

Calculate the volume of $\pu{2.0 mol}$ of $\ce{CO2}$ gas at $\pu{298 K}$ and $\pu{101.3 kPa}$.

**Solution:**
$$V = \frac{nRT}{P} = \frac{2.0 \times 8.314 \times 298}{101300} = \pu{0.0489 m3} = \pu{48.9 L}$$
```

## Tips for Content Creators

1. **Always test your LaTeX** - Preview questions before publishing
2. **Use `\text{...}` for regular text** within math mode
3. **Escape special characters** - Use `\{`, `\}`, `\_`, etc. when needed
4. **Keep it simple** - Complex nested structures may not render well
5. **Use display mode for equations** - Makes them more readable
6. **Combine chemistry and math** - You can mix `\ce{}` commands with regular math

## Quick Reference

| Feature | Syntax | Example |
|---------|--------|---------|
| Chemical formula | `\ce{...}` | `\ce{H2O}` |
| Physical units | `\pu{...}` | `\pu{25 °C}` |
| Reaction arrow | `\ce{->}` | `\ce{A -> B}` |
| Equilibrium | `\ce{<=>}` | `\ce{A <=> B}` |
| Table | `array` env | See examples above |
| Inline math | `$...$` | `$x^2$` |
| Display math | `$$...$$` | `$$\int x dx$$` |

## Additional Resources

- [KaTeX Documentation](https://katex.org/docs/supported.html)
- [KaTeX mhchem Extension](https://github.com/KaTeX/KaTeX/tree/main/contrib/mhchem)
- [mhchem Manual](https://mhchem.github.io/MathJax-mhchem/)
- [LaTeX Math Symbols](https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols)

---

**Note**: This guide is specific to the PhyNetix platform using KaTeX. Some advanced LaTeX features available in full LaTeX distributions may not work here.
