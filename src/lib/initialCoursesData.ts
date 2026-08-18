import { DetailedCourse } from '../types';

export const INITIAL_DETAILED_COURSES: DetailedCourse[] = [
  {
    id: 'crs-1',
    title: 'Neural Networks & Deep Learning with PyTorch',
    tagline: 'Master foundational backpropagation, autograd mechanics, transformer attention, and LoRA fine-tuning.',
    description:
      'A rigorous mathematical and code-driven exploration of modern deep learning architectures. From deriving gradient updates by hand to implementing multi-head self-attention and modern parameter-efficient fine-tuning (PEFT/LoRA).',
    domain: 'AI & Machine Learning',
    difficulty: 'advanced',
    totalDurationHours: 28,
    thumbnailIcon: 'Cpu',
    color: 'emerald',
    tags: ['PyTorch', 'Transformers', 'Backpropagation', 'LoRA', 'Deep Learning'],
    prerequisites: ['Linear Algebra (Matrix Operations)', 'Python / JS Programming', 'Basic Calculus (Chain Rule)'],
    learningOutcomes: [
      'Derive and implement forward and backward propagation from scratch',
      'Construct custom PyTorch Autograd functions and computational graphs',
      'Build Scaled Dot-Product & Multi-Head Self-Attention layers with causal masking',
      'Understand and implement RMSNorm, SwiGLU activations, and Rotary Positional Embeddings (RoPE)',
      'Fine-tune large language models using Low-Rank Adaptation (LoRA) and 4-bit Quantization',
    ],
    enrolled: false,
    userNotes: {},
    bookmarkedLessons: [],
    modules: [
      {
        id: 'mod-101',
        courseId: 'crs-1',
        title: 'Module 1: Tensors, Compute Graphs & Automatic Differentiation',
        description: 'Mathematical foundations of computational tensors, memory layout, broadcasting rules, and reverse-mode automatic differentiation.',
        order: 1,
        lessons: [
          {
            id: 'les-101',
            moduleId: 'mod-101',
            courseId: 'crs-1',
            title: 'Tensor Calculus, Dimensions & Stride Memory Layout',
            durationMinutes: 45,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 50,
            completed: false,
            summary: 'Explore N-dimensional arrays, contiguous memory buffers, strides, and NumPy/PyTorch broadcasting semantics.',
            keyConcepts: ['Contiguous Memory', 'Strides', 'Broadcasting Rules', 'Dimension Reduction'],
            contentMarkdown: `### N-Dimensional Tensors & Memory Layout

A tensor is an algebraic object that describes a multilinear relationship between sets of algebraic objects. In machine learning frameworks like PyTorch and NumPy, a tensor is physically stored in memory as a **1-dimensional contiguous buffer of raw bytes**, accompanied by metadata:

1. **Shape**: A tuple representing the length along each dimension (e.g., \`(batch_size, sequence_length, embedding_dim)\`).
2. **Strides**: A tuple defining the number of elements to skip in memory to advance by 1 step in each dimension.
3. **Data Type (\`dtype\`)**: Precision of each element (\`float32\`, \`bfloat16\`, \`int64\`).

\`\`\`python
import torch

# Create a 2x3 float32 tensor
x = torch.tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], dtype=torch.float32)
print("Shape:", x.shape)    # torch.Size([2, 3])
print("Strides:", x.stride()) # (3, 1) - move 3 floats for row, 1 float for column
\`\`\`

---

### Broadcasting Rules
When operating on two tensors of different shapes (e.g., $A + B$), PyTorch applies **broadcasting** without allocating duplicate memory:

- Compare shapes element-wise starting from the **trailing (rightmost) dimension** backwards.
- Two dimensions are compatible if:
  1. They are equal, OR
  2. One of them is $1$.

$$A \\in \\mathbb{R}^{32 \\times 1 \\times 768}, \\quad B \\in \\mathbb{R}^{1 \\times 128 \\times 768} \\implies (A + B) \\in \\mathbb{R}^{32 \\times 128 \\times 768}$$`,
            resources: [
              { title: 'PyTorch Tensor Internals Documentation', url: 'https://pytorch.org', type: 'docs' },
              { title: 'NumPy Broadcasting Mechanics Visual Guide', type: 'cheatsheet' },
            ],
            flashcards: [
              {
                id: 'fc-101',
                front: 'What are Tensor Strides?',
                back: 'Strides indicate the number of elements in flat physical memory that must be jumped over to access the next element along each dimension.',
                codeExample: 'x = torch.zeros(2, 3); x.stride() # (3, 1)',
              },
              {
                id: 'fc-102',
                front: 'What are the two conditions for tensor broadcasting?',
                back: 'From trailing dimensions backwards: either dimension sizes are equal, or one of the dimensions is exactly 1.',
              },
            ],
          },
          {
            id: 'les-102',
            moduleId: 'mod-101',
            courseId: 'crs-1',
            title: 'Reverse-Mode Autograd & Computational Graph Construction',
            durationMinutes: 50,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 75,
            completed: false,
            summary: 'Build a scalar autograd engine with topological sorting and backward chain rule propagation.',
            keyConcepts: ['Computational Graph', 'Topological Sort', 'Gradient Accumulation', 'Chain Rule'],
            contentMarkdown: `### Reverse-Mode Automatic Differentiation

Neural network optimization relies on reverse-mode automatic differentiation (Autograd). In this paradigm, a forward pass evaluates arithmetic operations and constructs a **Directed Acyclic Graph (DAG)** of operations.

Each intermediate node $v_i$ stores:
- Its evaluated scalar value $v_i$.
- References to its parent nodes.
- A local gradient closure: $\\frac{\\partial L}{\\partial \\text{parents}} = \\frac{\\partial L}{\\partial v_i} \\cdot \\frac{\\partial v_i}{\\partial \\text{parents}}$ (by Chain Rule).

During the backward pass:
1. Initialize the root loss gradient: $\\frac{\\partial L}{\\partial L} = 1.0$.
2. Traverse the graph in **reverse topological order**.
3. Accumulate gradients at each input node.`,
            codeLab: {
              id: 'cl-101',
              language: 'javascript',
              instructions: 'Implement the backward pass for scalar multiplication in our mini-autograd engine. Given node `out = a * b`, update `a.grad` and `b.grad` using the chain rule.',
              starterCode: `// Scalar Autograd Node implementation
class Value {
  constructor(data, children = [], op = '') {
    this.data = data;
    this.grad = 0.0;
    this._prev = children;
    this._op = op;
    this._backward = () => {};
  }

  mul(other) {
    other = other instanceof Value ? other : new Value(other);
    const out = new Value(this.data * other.data, [this, other], '*');
    
    out._backward = () => {
      // TODO: Apply the chain rule for multiplication!
      // Remember: d(a*b)/da = b and d(a*b)/db = a
      // Accumulate gradients: this.grad += ... ; other.grad += ...
      this.grad += other.data * out.grad;
      other.grad += this.data * out.grad;
    };
    
    return out;
  }

  backward() {
    const topo = [];
    const visited = new Set();
    const buildTopo = (v) => {
      if (!visited.has(v)) {
        visited.add(v);
        for (const child of v._prev) {
          buildTopo(child);
        }
        topo.push(v);
      }
    };
    buildTopo(this);
    this.grad = 1.0;
    for (let i = topo.length - 1; i >= 0; i--) {
      topo[i]._backward();
    }
  }
}

// Test scenario
const a = new Value(3.0);
const b = new Value(-4.0);
const c = a.mul(b); // c = 3 * -4 = -12
c.backward();

console.log("c.data =", c.data);
console.log("a.grad =", a.grad);
console.log("b.grad =", b.grad);
`,
              solutionCode: `class Value {
  constructor(data, children = [], op = '') {
    this.data = data;
    this.grad = 0.0;
    this._prev = children;
    this._op = op;
    this._backward = () => {};
  }

  mul(other) {
    other = other instanceof Value ? other : new Value(other);
    const out = new Value(this.data * other.data, [this, other], '*');
    
    out._backward = () => {
      this.grad += other.data * out.grad;
      other.grad += this.data * out.grad;
    };
    
    return out;
  }

  backward() {
    const topo = [];
    const visited = new Set();
    const buildTopo = (v) => {
      if (!visited.has(v)) {
        visited.add(v);
        for (const child of v._prev) {
          buildTopo(child);
        }
        topo.push(v);
      }
    };
    buildTopo(this);
    this.grad = 1.0;
    for (let i = topo.length - 1; i >= 0; i--) {
      topo[i]._backward();
    }
  }
}`,
              hints: [
                'In multiplication z = x * y, dz/dx = y and dz/dy = x.',
                'By the chain rule, dL/dx = (dL/dz) * (dz/dx) = out.grad * other.data.',
                'Always use += to accumulate gradients across fan-out branches in computational DAGs.',
              ],
              testCases: [
                {
                  id: 'tc-1',
                  description: 'Forward value of product matches mathematical definition',
                  testExpression: 'const a = new Value(3); const b = new Value(-4); const c = a.mul(b); return c.data === -12;',
                },
                {
                  id: 'tc-2',
                  description: 'Backward gradient of first factor `a.grad` equals `b.data`',
                  testExpression: 'const a = new Value(5); const b = new Value(2); const c = a.mul(b); c.backward(); return a.grad === 2 && b.grad === 5;',
                },
              ],
            },
            quiz: [
              {
                id: 'qz-101',
                question: 'Why do computational graph backprop engines accumulate gradients using `+=` rather than assignment `=`?',
                options: [
                  'To prevent division by zero in the optimizer step',
                  'Because a node can branch out to multiple children in the DAG, so gradients from all paths must be summed (Multivariable Chain Rule)',
                  'To convert single precision floats to double precision',
                  'To automatically normalize the learning rate',
                ],
                correctAnswer: 1,
                explanation: 'When a variable is used in multiple downstream operations (fan-out), the multivariable calculus chain rule states dL/dx = sum(dL/dy_i * dy_i/dx). Accumulating with += ensures all downstream gradient branches contribute to the total derivative.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-102',
        courseId: 'crs-1',
        title: 'Module 2: Multi-Layer Perceptrons & Modern Activation Functions',
        description: 'Matrix calculus for dense layers, vanishing gradient dynamics, ReLU vs GELU vs SwiGLU, and weight initialization strategies.',
        order: 2,
        lessons: [
          {
            id: 'les-103',
            moduleId: 'mod-102',
            courseId: 'crs-1',
            title: 'Activation Functions: ReLU, GELU, and SwiGLU Mathematics',
            durationMinutes: 40,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 50,
            completed: false,
            summary: 'Analyze mathematical properties, derivatives, and non-linearities behind standard modern LLM activations.',
            keyConcepts: ['GELU', 'SwiGLU', 'Gated Linear Units', 'Dying ReLU Problem'],
            contentMarkdown: `### Evolution of Non-Linear Activation Functions

Without non-linear activation functions, any multi-layer neural network collapses into a single affine transformation: $W_2 (W_1 x + b_1) + b_2 = W_{combined} x + b_{combined}$.

#### 1. Rectified Linear Unit (ReLU)
$$\\text{ReLU}(x) = \\max(0, x)$$
- **Pros**: Computationally trivial, solves vanishing gradients for positive inputs.
- **Cons**: "Dying ReLU" when gradients become permanently zero for negative pre-activations.

#### 2. Gaussian Error Linear Unit (GELU)
Popularized by BERT, GPT-2, and GPT-3:
$$\\text{GELU}(x) = x \\cdot \\Phi(x) = x \\cdot P(X \\le x), \\quad X \\sim \\mathcal{N}(0, 1)$$
Approximated in practice by:
$$\\text{GELU}(x) \\approx 0.5x \\left(1 + \\tanh\\left(\\sqrt{\\frac{2}{\\pi}}\\left(x + 0.044715 x^3\\right)\\right)\\right)$$

#### 3. SwiGLU (Swish Gated Linear Unit)
Used in **LLaMA, Mistral, and PaLM**:
$$\\text{SwiGLU}(x) = \\text{Swish}_{\\beta}(x W) \\otimes (x V)$$
where $\\text{Swish}(x) = x \\cdot \\sigma(\\beta x)$. Adding a bilinear gating mechanism allows the network to dynamically modulate information flow through feedforward projections.`,
            flashcards: [
              {
                id: 'fc-103',
                front: 'What is the SwiGLU activation formula used in LLaMA models?',
                back: 'SwiGLU(x) = (xW * sigmoid(xW)) ⊙ (xV), combining a Swish-activated linear projection with an element-wise gated linear projection.',
              },
            ],
          },
          {
            id: 'les-104',
            moduleId: 'mod-102',
            courseId: 'crs-1',
            title: 'Interactive Code Lab: Softmax & Cross-Entropy Loss Numerical Stability',
            durationMinutes: 55,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 80,
            completed: false,
            summary: 'Implement numerically stable Log-Softmax and Cross-Entropy Loss with log-sum-exp trick.',
            keyConcepts: ['LogSumExp Trick', 'Numerical Overflow', 'Cross-Entropy Derivative'],
            contentMarkdown: `### Numerical Stability in Softmax & Cross-Entropy

Naive calculation of Softmax:
$$\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$$
If $z_i = 1000$, $e^{1000} \\to \\infty$ resulting in floating-point overflow (\`NaN\`).

#### The Log-Sum-Exp Trick
By subtracting $M = \\max_k(z_k)$ from all logits:
$$\\sigma(z)_i = \\frac{e^{z_i - M}}{\\sum_j e^{z_j - M}}$$
Because $\\frac{e^{z_i - M}}{\\sum_j e^{z_j - M}} = \\frac{e^{-M} e^{z_i}}{e^{-M} \\sum_j e^{z_j}} = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$, the output is mathematically identical, but the maximum exponent is $e^0 = 1$, eliminating overflow entirely.`,
            codeLab: {
              id: 'cl-102',
              language: 'javascript',
              instructions: 'Implement a numerically stable softmax function `stableSoftmax(logits)` that handles large inputs without returning `NaN` or `Infinity`.',
              starterCode: `function stableSoftmax(logits) {
  // 1. Find the maximum logit value M to prevent overflow
  const maxLogit = Math.max(...logits);

  // 2. Subtract maxLogit from each element and compute exp
  const expValues = logits.map(z => Math.exp(z - maxLogit));

  // 3. Compute the sum of exponentiated values
  const sumExp = expValues.reduce((acc, val) => acc + val, 0);

  // 4. Return the normalized probabilities
  return expValues.map(v => v / sumExp);
}

// Test with large logits that would overflow naive exp()
const testLogits = [1000, 1002, 999];
const probs = stableSoftmax(testLogits);
console.log("Probabilities:", probs);
console.log("Sum of Probs:", probs.reduce((a, b) => a + b, 0).toFixed(6));
`,
              solutionCode: `function stableSoftmax(logits) {
  const maxLogit = Math.max(...logits);
  const expValues = logits.map(z => Math.exp(z - maxLogit));
  const sumExp = expValues.reduce((acc, val) => acc + val, 0);
  return expValues.map(v => v / sumExp);
}`,
              hints: [
                'Subtract Math.max(...logits) before calling Math.exp(x).',
                'Ensure probabilities sum to exactly 1.0 (within float rounding).',
              ],
              testCases: [
                {
                  id: 'tc-201',
                  description: 'Correctly normalizes standard logits to probabilities summing to 1',
                  testExpression: 'const p = stableSoftmax([1, 2, 3]); const sum = p.reduce((a,b)=>a+b, 0); return Math.abs(sum - 1.0) < 1e-5;',
                },
                {
                  id: 'tc-202',
                  description: 'Handles extreme values like 1000 without producing NaN or Infinity',
                  testExpression: 'const p = stableSoftmax([1000, 1002, 999]); return !isNaN(p[0]) && isFinite(p[0]) && p[1] > p[0];',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'mod-103',
        courseId: 'crs-1',
        title: 'Module 3: Transformer Attention & Modern Architecture',
        description: 'Scaled dot-product self-attention, causal masking, rotary positional embeddings (RoPE), and KV caching mechanics.',
        order: 3,
        lessons: [
          {
            id: 'les-105',
            moduleId: 'mod-103',
            courseId: 'crs-1',
            title: 'Scaled Dot-Product & Multi-Head Self-Attention Theory',
            durationMinutes: 50,
            type: 'theory',
            difficulty: 'advanced',
            xpReward: 60,
            completed: false,
            summary: 'Detailed derivation of Query, Key, Value attention formulation and $\\sqrt{d_k}$ variance scaling.',
            keyConcepts: ['Query-Key-Value', 'Scaled Dot Product', 'Multi-Head Attention', 'Causal Masking'],
            contentMarkdown: `### Attention Is All You Need: $Q, K, V$ Mechanics

In self-attention, each token in a sequence produces three representations via learned linear projections:
1. **Query ($Q$)**: What this token is searching for.
2. **Key ($K$)**: What this token represents / offers to matches.
3. **Value ($V$)**: The actual semantic information payload to be aggregated.

$$Q = X W_Q, \\quad K = X W_K, \\quad V = X W_V$$

#### The Attention Equation
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}} + M\\right) V$$

#### Why Scale by $\\sqrt{d_k}$?
If the components of $q$ and $k$ are independent random variables with mean $0$ and variance $1$, their dot product $q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i$ has mean $0$ and **variance $d_k$**.

For large dimension sizes (e.g., $d_k = 128$), the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients (gradient vanishing). Scaling by $\\frac{1}{\\sqrt{d_k}}$ stabilizes the variance back to $1.0$.`,
            flashcards: [
              {
                id: 'fc-104',
                front: 'Why is the dot product scaled by 1/sqrt(d_k) in transformer attention?',
                back: 'To prevent dot products from growing excessively large for high dimensions, which would push softmax into saturated regions with near-zero gradients.',
              },
            ],
          },
          {
            id: 'les-106',
            moduleId: 'mod-103',
            courseId: 'crs-1',
            title: 'Interactive Code Lab: Implement Scaled Dot-Product Attention with Causal Mask',
            durationMinutes: 60,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 90,
            completed: false,
            summary: 'Build matrix attention computations with triangular autoregressive masking in pure JavaScript/TypeScript.',
            keyConcepts: ['Matrix Multiplication', 'Causal Attention', 'Autoregressive Masking'],
            contentMarkdown: `### Autoregressive (Causal) Attention Masking

In decoder-only language models (GPT-4, LLaMA, Claude), tokens must not attend to future positions. We enforce this causality by adding an attention mask $M$ before the softmax step:

$$M_{ij} = \\begin{cases} 0 & \\text{if } j \\le i \\\\ -\\infty & \\text{if } j > i \\end{cases}$$

When $-10^9$ or $-\\infty$ is exponentiated in softmax: $e^{-\\infty} = 0$, strictly zeroing out the attention weights assigned to future tokens.`,
            codeLab: {
              id: 'cl-103',
              language: 'javascript',
              instructions: 'Implement the `scaledDotProductAttention(Q, K, V, isCausal)` function for 2D matrices (sequence length T x embedding dimension D). Apply the sqrt(d_k) scaling and causal mask if `isCausal` is true.',
              starterCode: `function matMul(A, B) {
  const rowsA = A.length, colsA = A[0].length, colsB = B[0].length;
  const result = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function transpose(A) {
  const rows = A.length, cols = A[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

function softmax2DRows(scores) {
  return scores.map(row => {
    const maxVal = Math.max(...row);
    const exps = row.map(val => (val === -Infinity ? 0 : Math.exp(val - maxVal)));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => (sum === 0 ? 0 : e / sum));
  });
}

function scaledDotProductAttention(Q, K, V, isCausal = true) {
  const T = Q.length;
  const d_k = Q[0].length;
  const scale = Math.sqrt(d_k);
  
  // 1. Compute Q * K^T
  const Kt = transpose(K);
  const scores = matMul(Q, Kt);

  // 2. Scale by sqrt(d_k) and apply causal mask if isCausal
  for (let i = 0; i < T; i++) {
    for (let j = 0; j < T; j++) {
      scores[i][j] = scores[i][j] / scale;
      if (isCausal && j > i) {
        scores[i][j] = -Infinity; // Mask future tokens
      }
    }
  }

  // 3. Apply row-wise Softmax
  const attnWeights = softmax2DRows(scores);

  // 4. Multiply attention weights with V
  const output = matMul(attnWeights, V);
  return { output, attnWeights };
}

// Test sample
const Q = [[1, 0], [0, 1]];
const K = [[1, 0], [0, 1]];
const V = [[10, 20], [30, 40]];
const result = scaledDotProductAttention(Q, K, V, true);
console.log("Attention Output:", result.output);
console.log("Attention Weights:", result.attnWeights);
`,
              solutionCode: `function scaledDotProductAttention(Q, K, V, isCausal = true) {
  const T = Q.length;
  const d_k = Q[0].length;
  const scale = Math.sqrt(d_k);
  
  const Kt = transpose(K);
  const scores = matMul(Q, Kt);

  for (let i = 0; i < T; i++) {
    for (let j = 0; j < T; j++) {
      scores[i][j] = scores[i][j] / scale;
      if (isCausal && j > i) {
        scores[i][j] = -Infinity;
      }
    }
  }

  const attnWeights = softmax2DRows(scores);
  const output = matMul(attnWeights, V);
  return { output, attnWeights };
}`,
              hints: [
                'Compute raw scores using matMul(Q, transpose(K)).',
                'Divide each score by Math.sqrt(d_k).',
                'If isCausal is true and column index j > row index i, assign score = -Infinity.',
              ],
              testCases: [
                {
                  id: 'tc-301',
                  description: 'Causal mask ensures first token only attends to itself (weight [1, 0])',
                  testExpression: `
                    const Q = [[1, 0], [0, 1]];
                    const K = [[1, 0], [0, 1]];
                    const V = [[10, 20], [30, 40]];
                    const res = scaledDotProductAttention(Q, K, V, true);
                    return res.attnWeights[0][0] === 1 && res.attnWeights[0][1] === 0;
                  `,
                },
                {
                  id: 'tc-302',
                  description: 'Output shape matches sequence length T and value dimension D',
                  testExpression: `
                    const Q = [[1, 0], [0, 1]];
                    const K = [[1, 0], [0, 1]];
                    const V = [[10, 20], [30, 40]];
                    const res = scaledDotProductAttention(Q, K, V, true);
                    return res.output.length === 2 && res.output[0].length === 2;
                  `,
                },
              ],
            },
          },
          {
            id: 'les-107',
            moduleId: 'mod-103',
            courseId: 'crs-1',
            title: 'Graded Comprehensive Assessment: Transformer Mastery',
            durationMinutes: 30,
            type: 'quiz',
            difficulty: 'advanced',
            xpReward: 100,
            completed: false,
            summary: 'Comprehensive examination testing transformer mechanics, autograd, RoPE, and attention scaling.',
            keyConcepts: ['RoPE', 'KV Cache', 'Transformer Benchmarking', 'Multi-Head Projection'],
            contentMarkdown: `### Transformer Architecture Comprehensive Exam

This graded knowledge check tests your mastery across all core transformer components:
- Scaled Dot-Product formulation.
- Multi-Head projection geometry.
- Rotary Position Embeddings (RoPE) complex inner products.
- KV Caching inference optimization for autoregressive decoding.`,
            quiz: [
              {
                id: 'q-trans-1',
                question: 'What is the primary benefit of Rotary Position Embeddings (RoPE) over absolute sinusoidal positional embeddings?',
                options: [
                  'RoPE eliminates the need for matrix multiplication in linear layers',
                  'RoPE naturally incorporates relative position decay through inner products in complex space, allowing better extrapolation to long contexts',
                  'RoPE reduces model parameter count by 50%',
                  'RoPE forces all attention weights to be strictly binary',
                ],
                correctAnswer: 1,
                explanation: 'RoPE encodes positional information by rotating query and key vectors in complex 2D planes. The dot product between rotated Q and K naturally depends only on the relative distance (m - n), yielding superior context length generalization.',
              },
              {
                id: 'q-trans-2',
                question: 'Why does Key-Value (KV) caching accelerate autoregressive LLM token generation?',
                options: [
                  'It compiles the PyTorch model to CUDA C++ kernels during runtime',
                  'It stores previously computed K and V projections for past prompt tokens, preventing redundant O(N^2) recomputation on each newly generated token',
                  'It reduces the precision of weights from 16-bit to 1-bit',
                  'It executes beam search in parallel on CPU threads',
                ],
                correctAnswer: 1,
                explanation: 'During autoregressive generation, past token representations do not change due to the causal mask. By caching past Key and Value matrices in GPU VRAM, generating token N only requires computing Query for token N and attending over the cached history in O(N) time.',
              },
              {
                id: 'q-trans-3',
                question: 'In Low-Rank Adaptation (LoRA), how are the weight updates parameterized for a frozen weight matrix W0 of size (d x k)?',
                options: [
                  'W = W0 * alpha',
                  'delta W = B * A, where B is (d x r) and A is (r x k) with rank r << min(d, k)',
                  'delta W is a diagonal matrix containing top singular values',
                  'W = W0 + random_noise(d, k)',
                ],
                correctAnswer: 1,
                explanation: 'LoRA decomposes weight updates into two low-rank matrices delta W = B * A with rank r (often 8 or 16). This reduces trainable parameters by >99% while preserving full expressive power during downstream task adaptation.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'crs-2',
    title: 'Distributed Systems & High-Throughput Microservices',
    tagline: 'Design fault-tolerant distributed consensus, Kafka event streams, and consistent hashing rings.',
    description:
      'A deep dive into distributed systems engineering. Implement Raft consensus protocols, consistent hashing rings with virtual nodes, distributed locking algorithms, and event-driven architectures capable of sub-millisecond latencies.',
    domain: 'Programming & CS',
    difficulty: 'advanced',
    totalDurationHours: 24,
    thumbnailIcon: 'Network',
    color: 'indigo',
    tags: ['Distributed Systems', 'Raft Consensus', 'Kafka', 'Consistent Hashing', 'Microservices'],
    prerequisites: ['Data Structures & Algorithms', 'Concurrency / Async I/O', 'Networking Fundamentals (TCP/IP)'],
    learningOutcomes: [
      'Understand CAP Theorem, PACELC, and distributed safety vs liveness guarantees',
      'Simulate Raft leader election, heartbeats, and quorum log replication',
      'Implement a Consistent Hashing ring with virtual nodes for distributed sharding',
      'Design idempotent event consumers with Kafka partition rebalancing and exactly-once semantics',
      'Master distributed locking patterns with Redlock and lease fencing tokens',
    ],
    enrolled: false,
    bookmarkedLessons: [],
    modules: [
      {
        id: 'mod-201',
        courseId: 'crs-2',
        title: 'Module 1: Distributed Foundations & Consensus Mechanics',
        description: 'Network partitions, quorum intersection, Raft leader election, and distributed state machine replication.',
        order: 1,
        lessons: [
          {
            id: 'les-201',
            moduleId: 'mod-201',
            courseId: 'crs-2',
            title: 'CAP Theorem, PACELC, and Failure Modes in Distributed Nodes',
            durationMinutes: 40,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 45,
            completed: false,
            summary: 'Formal definition of Consistency, Availability, and Partition Tolerance, plus PACELC tradeoffs in latency.',
            keyConcepts: ['CAP Theorem', 'PACELC', 'Split-Brain', 'Quorum'],
            contentMarkdown: `### The CAP & PACELC Theorems

In any asynchronous network prone to node dropouts and packet drops:

#### CAP Theorem
1. **Consistency ($C$)**: Every read receives the most recent write or an error.
2. **Availability ($A$)**: Every non-failing node returns a non-error response without guarantee of recent write.
3. **Partition Tolerance ($P$)**: The system continues to operate despite arbitrary packet loss or network partitions.

Because physical networks *will* partition, a distributed system must choose between **CP** (reject writes/reads during partition to prevent split-brain) or **AP** (serve stale data to maintain 100% uptime).

#### PACELC Extension
$$\\text{If Partition (P)} \\implies \\text{Choose Availability (A) or Consistency (C)}$$
$$\\text{Else (E)} \\implies \\text{Choose Latency (L) or Consistency (C)}$$`,
            flashcards: [
              {
                id: 'fc-201',
                front: 'What does the PACELC theorem state during normal non-partitioned operation?',
                back: 'Else (when network is normal), trade off Latency (L) versus Consistency (C).',
              },
            ],
          },
          {
            id: 'les-202',
            moduleId: 'mod-201',
            courseId: 'crs-2',
            title: 'Interactive Code Lab: Raft Quorum Voting & Split-Brain Prevention',
            durationMinutes: 55,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 85,
            completed: false,
            summary: 'Implement quorum vote counting and majority validation for a distributed cluster of N nodes.',
            keyConcepts: ['Quorum Math', 'Majority Rule', 'Election Timeout'],
            contentMarkdown: `### Quorum Mechanics in Consensus

To prevent split-brain where two partitioned halves of a cluster both elect a leader and accept conflicting writes, Raft requires a strict **Majority Quorum**:

$$\\text{Quorum Size} = \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1$$

- In a cluster of $N=3$ nodes: $\\text{Quorum} = 2$. Maximum allowable node failures $f = 1$.
- In a cluster of $N=5$ nodes: $\\text{Quorum} = 3$. Maximum allowable node failures $f = 2$.
- Two majority quorums in a cluster of size $N$ *must* overlap in at least one node by the Pigeonhole Principle.`,
            codeLab: {
              id: 'cl-201',
              language: 'javascript',
              instructions: 'Implement the `checkQuorum(totalNodes, votesGranted)` function. Return an object `{ isLeaderElected: boolean, requiredQuorum: number, margin: number }`.',
              starterCode: `function checkQuorum(totalNodes, votesGranted) {
  // 1. Calculate required majority quorum: floor(totalNodes / 2) + 1
  const requiredQuorum = Math.floor(totalNodes / 2) + 1;

  // 2. Determine if votes granted meets or exceeds the required quorum
  const isLeaderElected = votesGranted >= requiredQuorum;

  // 3. Margin of victory/shortfall relative to required quorum
  const margin = votesGranted - requiredQuorum;

  return {
    isLeaderElected,
    requiredQuorum,
    margin,
    faultTolerance: Math.floor((totalNodes - 1) / 2)
  };
}

console.log("5-node cluster with 3 votes:", checkQuorum(5, 3));
console.log("5-node cluster with 2 votes:", checkQuorum(5, 2));
`,
              solutionCode: `function checkQuorum(totalNodes, votesGranted) {
  const requiredQuorum = Math.floor(totalNodes / 2) + 1;
  const isLeaderElected = votesGranted >= requiredQuorum;
  const margin = votesGranted - requiredQuorum;
  return {
    isLeaderElected,
    requiredQuorum,
    margin,
    faultTolerance: Math.floor((totalNodes - 1) / 2)
  };
}`,
              hints: [
                'Quorum is Math.floor(totalNodes / 2) + 1.',
                'For 5 nodes, quorum is 3. For 3 nodes, quorum is 2.',
              ],
              testCases: [
                {
                  id: 'tc-raft-1',
                  description: '3 votes in 5-node cluster wins election',
                  testExpression: 'const res = checkQuorum(5, 3); return res.isLeaderElected === true && res.requiredQuorum === 3;',
                },
                {
                  id: 'tc-raft-2',
                  description: '2 votes in 5-node cluster fails to win election',
                  testExpression: 'const res = checkQuorum(5, 2); return res.isLeaderElected === false && res.margin === -1;',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'mod-202',
        courseId: 'crs-2',
        title: 'Module 2: Distributed Sharding & Consistent Hashing',
        description: 'Consistent hashing rings with MD5/MurmurHash, virtual nodes distribution, and hot-shard mitigation.',
        order: 2,
        lessons: [
          {
            id: 'les-203',
            moduleId: 'mod-202',
            courseId: 'crs-2',
            title: 'Consistent Hashing Theory & Virtual Nodes Architecture',
            durationMinutes: 45,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 50,
            completed: false,
            summary: 'Learn why modulo hashing fails under cluster scaling and how ring hashing minimizes key remapping to $K/N$.',
            keyConcepts: ['Hash Ring', 'Virtual Nodes', 'Minimal Key Movement', 'Data Skew'],
            contentMarkdown: `### The Problem with Modulo Hashing
In naive sharding: $\\text{Server} = \\text{hash}(key) \\pmod N$.
If one server is added ($N \\to N+1$), almost **100% of all keys** change location, causing a catastrophic cache stampede / full database migration.

### Consistent Hashing Ring
Consistent hashing maps both **Servers** and **Keys** onto a circular $2^{32}-1$ integer ring:

1. Hash each physical server name to positions on the ring: $pos = \\text{hash}(server_i)$.
2. To find the responsible server for a key, compute $pos_{key} = \\text{hash}(key)$ and move **clockwise** along the ring until encountering the first server.
3. Adding or removing a server only remaps keys belonging to the immediate neighboring arc: $\\approx \\frac{K}{N}$ keys moved!

#### Virtual Nodes
To prevent uneven data distribution (hot spots), each physical node is replicated $V$ times across the ring under names like \`node-A#1\`, \`node-A#2\`, \`node-A#3\`.`,
            flashcards: [
              {
                id: 'fc-202',
                front: 'What fraction of keys must be remapped when adding 1 node in consistent hashing?',
                back: 'Only roughly K/N keys (where K is total keys and N is total servers), compared to ~100% in naive modulo hashing.',
              },
            ],
          },
          {
            id: 'les-204',
            moduleId: 'mod-202',
            courseId: 'crs-2',
            title: 'Interactive Code Lab: Build a Consistent Hash Ring in TypeScript',
            durationMinutes: 60,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 90,
            completed: false,
            summary: 'Implement node registration, virtual node mapping, and clockwise binary search key lookup.',
            keyConcepts: ['Binary Search', 'Ring Topology', 'Key Routing'],
            contentMarkdown: `### Implementing Clockwise Ring Lookup

To look up a key efficiently:
1. Hash the key string into an integer $H$.
2. Perform a **binary search (bisect_right)** on the sorted array of ring node hashes.
3. If $H$ is greater than all node hashes, wrap around to index $0$ (the circular ring property).`,
            codeLab: {
              id: 'cl-202',
              language: 'javascript',
              instructions: 'Implement `ConsistentHashRing` with `addNode(node, vNodes)` and `getNode(key)` methods using a simple deterministic string hash.',
              starterCode: `function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

class ConsistentHashRing {
  constructor(virtualNodes = 3) {
    this.virtualNodes = virtualNodes;
    this.ring = []; // sorted array of { hash: number, node: string }
  }

  addNode(node) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const vKey = \`\${node}#vnode\${i}\`;
      const hash = simpleHash(vKey);
      this.ring.push({ hash, node });
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const keyHash = simpleHash(key);

    // Clockwise lookup: find first entry where entry.hash >= keyHash
    for (const entry of this.ring) {
      if (entry.hash >= keyHash) {
        return entry.node;
      }
    }
    // Wrap around to the start of the ring
    return this.ring[0].node;
  }
}

const ring = new ConsistentHashRing(3);
ring.addNode("server-alpha");
ring.addNode("server-beta");
ring.addNode("server-gamma");

console.log("User 101 routes to:", ring.getNode("user-101"));
console.log("User 402 routes to:", ring.getNode("user-402"));
`,
              solutionCode: `class ConsistentHashRing {
  constructor(virtualNodes = 3) {
    this.virtualNodes = virtualNodes;
    this.ring = [];
  }

  addNode(node) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = simpleHash(\`\${node}#vnode\${i}\`);
      this.ring.push({ hash, node });
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const keyHash = simpleHash(key);
    for (const entry of this.ring) {
      if (entry.hash >= keyHash) {
        return entry.node;
      }
    }
    return this.ring[0].node;
  }
}`,
              hints: [
                'Sort this.ring by hash in ascending order.',
                'Find the first item with item.hash >= keyHash, otherwise wrap to ring[0].node.',
              ],
              testCases: [
                {
                  id: 'tc-chr-1',
                  description: 'Consistent hash ring routes identical keys to the exact same node',
                  testExpression: `
                    const r = new ConsistentHashRing(4);
                    r.addNode("node-A");
                    r.addNode("node-B");
                    const n1 = r.getNode("session-xyz");
                    const n2 = r.getNode("session-xyz");
                    return n1 === n2 && (n1 === "node-A" || n1 === "node-B");
                  `,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'crs-3',
    title: 'Orderflow, Liquidity & Auction Market Theory',
    tagline: 'Analyze Level 2 DOM, Volume Profile, Cumulative Delta (CVD), and risk-managed market execution.',
    description:
      'A professional trading education track covering market microstructure, limit order book mechanics, institutional liquidity pools, VWAP statistical standard deviation bands, and mathematical position sizing with the Kelly Criterion.',
    domain: 'Trading Education',
    difficulty: 'intermediate',
    totalDurationHours: 18,
    thumbnailIcon: 'CandlestickChart',
    color: 'amber',
    tags: ['Orderflow', 'Volume Profile', 'CVD', 'VWAP', 'Risk Management'],
    prerequisites: ['Basic Candlestick Charting', 'Probability Basics', 'Market Concepts (Bid/Ask/Spread)'],
    learningOutcomes: [
      'Deconstruct the Level 2 Limit Order Book (DOM) and aggressive vs passive order matching',
      'Identify institutional absorption and exhaustion using Cumulative Volume Delta (CVD)',
      'Construct Developing Volume Profiles with Value Area High (VAH), Point of Control (POC), and VAL',
      'Calculate Volume-Weighted Average Price (VWAP) with 1st, 2nd, and 3rd standard deviation bands',
      'Execute risk-of-ruin position sizing using the Fractional Kelly Criterion and strict R-multiples',
    ],
    enrolled: false,
    bookmarkedLessons: [],
    modules: [
      {
        id: 'mod-301',
        courseId: 'crs-3',
        title: 'Module 1: Market Microstructure & Order Book Dynamics',
        description: 'Passive limit orders vs aggressive market orders, matching engine mechanics, and spread dynamics.',
        order: 1,
        lessons: [
          {
            id: 'les-301',
            moduleId: 'mod-301',
            courseId: 'crs-3',
            title: 'Auction Market Theory & Limit Order Book (LOB) Mechanics',
            durationMinutes: 40,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 45,
            completed: false,
            summary: 'Understand how matching engines match aggressive market liquidity against resting limit orders.',
            keyConcepts: ['Depth of Market', 'Passive vs Aggressive Orders', 'Auction Market Theory', 'Slippage'],
            contentMarkdown: `### Auction Market Theory (AMT)

Financial markets exist for one fundamental purpose: **to facilitate trade between buyers and sellers through continuous two-way double auctions**.

1. **Price** is the advertising mechanism that discovers where trade can occur.
2. **Time** regulates opportunities.
3. **Volume** measures market acceptance or rejection.

#### The Limit Order Book (LOB)
- **Passive Limit Orders**: Resting orders placed at specific price levels that provide liquidity (bids below current price, asks above).
- **Aggressive Market Orders**: Orders executed immediately at market price that consume resting liquidity and move the price ladder.`,
            flashcards: [
              {
                id: 'fc-301',
                front: 'What type of order consumes liquidity and moves price across the spread?',
                back: 'Aggressive Market Orders (they match immediately against resting limit orders).',
              },
            ],
          },
          {
            id: 'les-302',
            moduleId: 'mod-301',
            courseId: 'crs-3',
            title: 'Interactive Code Lab: Calculate Anchored VWAP and Standard Deviation Bands',
            durationMinutes: 50,
            type: 'code_lab',
            difficulty: 'intermediate',
            xpReward: 75,
            completed: false,
            summary: 'Implement volume-weighted average price and variance bands from raw price/volume tick data.',
            keyConcepts: ['VWAP Formula', 'Statistical Bands', 'Volume Weighting'],
            contentMarkdown: `### Volume-Weighted Average Price (VWAP)

$$\\text{VWAP} = \\frac{\\sum_{i} (P_i \\cdot V_i)}{\\sum_{i} V_i}$$
where $P_i = \\frac{\\text{High}_i + \\text{Low}_i + \\text{Close}_i}{3}$ (Typical Price).

#### Standard Deviation Bands
$$\\sigma_{\\text{VWAP}} = \\sqrt{\\frac{\\sum_{i} V_i (P_i - \\text{VWAP})^2}{\\sum_i V_i}}$$
- $\\text{Band}_{+1} = \\text{VWAP} + 1.0 \\cdot \\sigma$
- $\\text{Band}_{-1} = \\text{VWAP} - 1.0 \\cdot \\sigma$`,
            codeLab: {
              id: 'cl-301',
              language: 'javascript',
              instructions: 'Implement `calculateVWAP(bars)` where each bar is `{ high, low, close, volume }`. Return `{ vwap: number, stdDev: number, upperBand: number, lowerBand: number }`.',
              starterCode: `function calculateVWAP(bars) {
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativePV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }

  const vwap = cumulativePV / cumulativeVolume;

  // Calculate volume-weighted variance
  let cumulativeVariance = 0;
  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeVariance += bar.volume * Math.pow(typicalPrice - vwap, 2);
  }

  const stdDev = Math.sqrt(cumulativeVariance / cumulativeVolume);

  return {
    vwap: parseFloat(vwap.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    upperBand: parseFloat((vwap + stdDev).toFixed(2)),
    lowerBand: parseFloat((vwap - stdDev).toFixed(2))
  };
}

const sampleBars = [
  { high: 102, low: 98, close: 100, volume: 1000 },
  { high: 105, low: 100, close: 104, volume: 2500 },
  { high: 106, low: 102, close: 103, volume: 1500 }
];

console.log("Calculated VWAP:", calculateVWAP(sampleBars));
`,
              solutionCode: `function calculateVWAP(bars) {
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumulativePV += tp * bar.volume;
    cumulativeVolume += bar.volume;
  }

  const vwap = cumulativePV / cumulativeVolume;
  let cumulativeVariance = 0;
  for (const bar of bars) {
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumulativeVariance += bar.volume * Math.pow(tp - vwap, 2);
  }

  const stdDev = Math.sqrt(cumulativeVariance / cumulativeVolume);
  return {
    vwap: parseFloat(vwap.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    upperBand: parseFloat((vwap + stdDev).toFixed(2)),
    lowerBand: parseFloat((vwap - stdDev).toFixed(2))
  };
}`,
              hints: [
                'Typical Price is (high + low + close) / 3.',
                'VWAP is sum(typicalPrice * volume) / sum(volume).',
                'Variance is sum(volume * (typicalPrice - vwap)^2) / sum(volume).',
              ],
              testCases: [
                {
                  id: 'tc-vwap-1',
                  description: 'Returns correct numerical VWAP for uniform price bars',
                  testExpression: `
                    const bars = [{ high: 100, low: 100, close: 100, volume: 500 }];
                    const res = calculateVWAP(bars);
                    return res.vwap === 100 && res.stdDev === 0;
                  `,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'crs-4',
    title: 'Advanced Algorithms & Systems Optimization in TypeScript',
    tagline: 'Master Trie prefix trees, Interval DP, Bitwise Bloom Filters, and high-performance data structures.',
    description:
      'Elevate your core computer science mastery. Explore dynamic programming state optimization, compressed radix tries, cache-conscious memory layouts, and probabilistic data structures used in production search engines and high-throughput systems.',
    domain: 'Programming & CS',
    difficulty: 'advanced',
    totalDurationHours: 20,
    thumbnailIcon: 'Binary',
    color: 'violet',
    tags: ['Algorithms', 'Data Structures', 'Dynamic Programming', 'Trie', 'Bloom Filters'],
    prerequisites: ['Intermediate TypeScript/JavaScript', 'Big-O Asymptotic Complexity', 'Recursion & Trees'],
    learningOutcomes: [
      'Construct high-speed Prefix Tries with autocomplete and wildcard matching',
      'Optimize multi-dimensional dynamic programming using bitmask states and space compression',
      'Build probabilistic Bloom Filters and calculate optimal false-positive hash count formulas',
      'Analyze cache locality, memory alignment, and V8 engine JIT optimization patterns',
    ],
    enrolled: false,
    modules: [
      {
        id: 'mod-401',
        courseId: 'crs-4',
        title: 'Module 1: High-Performance Search Trees & Tries',
        description: 'Trie structures, radix compaction, and sub-millisecond prefix search engines.',
        order: 1,
        lessons: [
          {
            id: 'les-401',
            moduleId: 'mod-401',
            courseId: 'crs-4',
            title: 'Trie Prefix Search Architecture and Space Optimization',
            durationMinutes: 40,
            type: 'theory',
            difficulty: 'intermediate',
            xpReward: 50,
            completed: false,
            summary: 'Learn how tree-structured retrieval yields $O(L)$ search time independent of catalog size $N$.',
            keyConcepts: ['Trie Trees', 'Prefix Lookup', 'Radix Compaction', 'Space Complexity'],
            contentMarkdown: `### Trie (Prefix Tree) Fundamentals

A Trie is a tree data structure used to store a dynamic set of strings where keys are usually sequences of characters. Unlike binary search trees where lookup is $O(\\log N)$, Trie search time is strictly:

$$O(L)$$
where $L$ is the **length of the query string**, completely independent of the number of items $N$ stored in the database!`,
            flashcards: [
              {
                id: 'fc-401',
                front: 'What is the time complexity of searching a word of length L in a Trie with N words?',
                back: 'O(L) time, proportional only to the word length L regardless of N.',
              },
            ],
          },
          {
            id: 'les-402',
            moduleId: 'mod-401',
            courseId: 'crs-4',
            title: 'Interactive Code Lab: Implement an Autocomplete Prefix Trie',
            durationMinutes: 55,
            type: 'code_lab',
            difficulty: 'advanced',
            xpReward: 85,
            completed: false,
            summary: 'Build `insert`, `search`, and `autocomplete(prefix)` methods on a Trie structure.',
            keyConcepts: ['DFS Traversal', 'Prefix Search', 'Trie Node'],
            contentMarkdown: `### Autocomplete Search Algorithm

To return all words matching a prefix:
1. Walk down the tree to the end node of the prefix.
2. If any character along the path doesn't exist, return \`[]\`.
3. Perform a Depth-First Search (DFS) from that node, collecting all child paths where \`isEndOfWord === true\`.`,
            codeLab: {
              id: 'cl-401',
              language: 'javascript',
              instructions: 'Implement the `autocomplete(prefix)` method on `Trie` to return all inserted words starting with `prefix`.',
              starterCode: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (const char of word) {
      if (!curr.children[char]) {
        curr.children[char] = new TrieNode();
      }
      curr = curr.children[char];
    }
    curr.isEndOfWord = true;
  }

  autocomplete(prefix) {
    let curr = this.root;
    for (const char of prefix) {
      if (!curr.children[char]) return [];
      curr = curr.children[char];
    }

    const results = [];
    const dfs = (node, path) => {
      if (node.isEndOfWord) results.push(path);
      for (const char in node.children) {
        dfs(node.children[char], path + char);
      }
    };
    dfs(curr, prefix);
    return results.sort();
  }
}

const trie = new Trie();
trie.insert("apple");
trie.insert("app");
trie.insert("application");
trie.insert("aptitude");
trie.insert("banana");

console.log("Autocomplete 'app':", trie.autocomplete("app"));
console.log("Autocomplete 'apt':", trie.autocomplete("apt"));
`,
              solutionCode: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (const char of word) {
      if (!curr.children[char]) curr.children[char] = new TrieNode();
      curr = curr.children[char];
    }
    curr.isEndOfWord = true;
  }

  autocomplete(prefix) {
    let curr = this.root;
    for (const char of prefix) {
      if (!curr.children[char]) return [];
      curr = curr.children[char];
    }
    const results = [];
    const dfs = (node, path) => {
      if (node.isEndOfWord) results.push(path);
      for (const char in node.children) {
        dfs(node.children[char], path + char);
      }
    };
    dfs(curr, prefix);
    return results.sort();
  }
}`,
              hints: [
                'Navigate to prefix node first.',
                'Use recursion (DFS) to collect all suffixes from that node.',
              ],
              testCases: [
                {
                  id: 'tc-trie-1',
                  description: 'Correctly matches all words starting with prefix',
                  testExpression: `
                    const t = new Trie();
                    t.insert("car"); t.insert("card"); t.insert("carpet"); t.insert("dog");
                    const res = t.autocomplete("car");
                    return res.length === 3 && res.includes("car") && res.includes("card") && res.includes("carpet");
                  `,
                },
              ],
            },
          },
        ],
      },
    ],
  },
];
